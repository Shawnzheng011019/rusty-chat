pub mod auth;
pub mod users;
pub mod messages;
pub mod friends;
pub mod groups;
pub mod files;

use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::AppState;

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let user_id = match state.services.auth.verify_access_token(token) {
        Ok(user_id) => user_id,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    request.extensions_mut().insert(user_id);
    Ok(next.run(request).await)
}

pub fn extract_user_id(request: &Request) -> Result<Uuid, StatusCode> {
    request
        .extensions()
        .get::<Uuid>()
        .copied()
        .ok_or(StatusCode::UNAUTHORIZED)
}

// Helper function to convert StatusCode to the expected error type
pub fn convert_auth_error(err: StatusCode) -> (StatusCode, axum::Json<serde_json::Value>) {
    (err, axum::Json(serde_json::json!({ "error": "Unauthorized" })))
}

// Custom extractor for user ID
pub struct AuthenticatedUser(pub Uuid);

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let user_id = parts
            .extensions
            .get::<Uuid>()
            .copied()
            .ok_or_else(|| convert_auth_error(StatusCode::UNAUTHORIZED))?;

        Ok(AuthenticatedUser(user_id))
    }
}
