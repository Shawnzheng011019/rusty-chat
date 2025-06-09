use crate::{
    database::Database,
    models::{User, UserResponse},
};
use anyhow::Result;
use uuid::Uuid;

#[derive(Clone)]
pub struct UserService {
    db: Database,
}

impl UserService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn get_user_by_id(&self, user_id: Uuid) -> Result<UserResponse> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(self.db.pool())
            .await?;

        Ok(user.into())
    }

    pub async fn search_users(&self, query: &str, limit: i64) -> Result<Vec<UserResponse>> {
        let users = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE username ILIKE $1 OR email ILIKE $1 LIMIT $2"
        )
        .bind(format!("%{}%", query))
        .bind(limit)
        .fetch_all(self.db.pool())
        .await?;

        Ok(users.into_iter().map(|u| u.into()).collect())
    }

    pub async fn update_online_status(&self, user_id: Uuid, is_online: bool) -> Result<()> {
        let query = if is_online {
            "UPDATE users SET is_online = true WHERE id = $1"
        } else {
            "UPDATE users SET is_online = false, last_seen = NOW() WHERE id = $1"
        };

        sqlx::query(query)
            .bind(user_id)
            .execute(self.db.pool())
            .await?;

        Ok(())
    }

    pub async fn update_avatar(&self, user_id: Uuid, avatar_url: String) -> Result<()> {
        sqlx::query("UPDATE users SET avatar_url = $1 WHERE id = $2")
            .bind(avatar_url)
            .bind(user_id)
            .execute(self.db.pool())
            .await?;

        Ok(())
    }
}
