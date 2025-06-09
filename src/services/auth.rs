use crate::{
    database::Database,
    models::{AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, User},
};
use anyhow::{anyhow, Result};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

#[derive(Clone)]
pub struct AuthService {
    db: Database,
    jwt_secret: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user id
    pub exp: usize,  // expiration time
    pub iat: usize,  // issued at
}

impl AuthService {
    pub fn new(db: Database, jwt_secret: String) -> Self {
        Self { db, jwt_secret }
    }

    pub async fn register(&self, request: RegisterRequest) -> Result<AuthResponse> {
        // Check if user already exists
        let existing_user = sqlx::query("SELECT id FROM users WHERE email = $1")
            .bind(&request.email)
            .fetch_optional(self.db.pool())
            .await?;

        if existing_user.is_some() {
            return Err(anyhow!("User with this email already exists"));
        }

        // Hash password
        let password_hash = hash(&request.password, DEFAULT_COST)?;

        // Create user
        let user_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO users (id, email, username, password_hash) VALUES ($1, $2, $3, $4)"
        )
        .bind(user_id)
        .bind(&request.email)
        .bind(&request.username)
        .bind(&password_hash)
        .execute(self.db.pool())
        .await?;

        // Fetch created user
        let user = self.get_user_by_id(user_id).await?;

        // Generate tokens
        let access_token = self.generate_access_token(user_id)?;
        let refresh_token = self.generate_refresh_token(user_id).await?;

        Ok(AuthResponse {
            user: user.into(),
            access_token,
            refresh_token,
        })
    }

    pub async fn login(&self, request: LoginRequest) -> Result<AuthResponse> {
        // Get user by email
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE email = $1"
        )
        .bind(&request.email)
        .fetch_optional(self.db.pool())
        .await?
        .ok_or_else(|| anyhow!("Invalid email or password"))?;

        // Verify password
        if !verify(&request.password, &user.password_hash)? {
            return Err(anyhow!("Invalid email or password"));
        }

        // Update user online status
        sqlx::query("UPDATE users SET is_online = true WHERE id = $1")
            .bind(user.id)
            .execute(self.db.pool())
            .await?;

        // Generate tokens
        let access_token = self.generate_access_token(user.id)?;
        let refresh_token = self.generate_refresh_token(user.id).await?;

        Ok(AuthResponse {
            user: user.into(),
            access_token,
            refresh_token,
        })
    }

    pub async fn refresh_token(&self, request: RefreshTokenRequest) -> Result<AuthResponse> {
        // Verify refresh token
        let user_id = self.verify_refresh_token(&request.refresh_token).await?;

        // Get user
        let user = self.get_user_by_id(user_id).await?;

        // Generate new tokens
        let access_token = self.generate_access_token(user_id)?;
        let refresh_token = self.generate_refresh_token(user_id).await?;

        Ok(AuthResponse {
            user: user.into(),
            access_token,
            refresh_token,
        })
    }

    pub fn verify_access_token(&self, token: &str) -> Result<Uuid> {
        let token_data: TokenData<Claims> = decode(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default(),
        )?;

        Ok(Uuid::parse_str(&token_data.claims.sub)?)
    }

    fn generate_access_token(&self, user_id: Uuid) -> Result<String> {
        let now = Utc::now();
        let exp = (now + Duration::hours(24)).timestamp() as usize;
        let iat = now.timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp,
            iat,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )?;

        Ok(token)
    }

    async fn generate_refresh_token(&self, user_id: Uuid) -> Result<String> {
        let token = Uuid::new_v4().to_string();
        let token_hash = hash(&token, DEFAULT_COST)?;
        let expires_at = Utc::now() + Duration::days(30);

        // Store refresh token
        sqlx::query(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)"
        )
        .bind(user_id)
        .bind(&token_hash)
        .bind(expires_at)
        .execute(self.db.pool())
        .await?;

        Ok(token)
    }

    async fn verify_refresh_token(&self, token: &str) -> Result<Uuid> {
        let rows = sqlx::query(
            "SELECT user_id, token_hash FROM refresh_tokens WHERE expires_at > NOW()"
        )
        .fetch_all(self.db.pool())
        .await?;

        for row in rows {
            let token_hash: String = row.get("token_hash");
            if verify(token, &token_hash)? {
                let user_id: Uuid = row.get("user_id");
                return Ok(user_id);
            }
        }

        Err(anyhow!("Invalid refresh token"))
    }

    async fn get_user_by_id(&self, user_id: Uuid) -> Result<User> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(self.db.pool())
            .await?;

        Ok(user)
    }
}
