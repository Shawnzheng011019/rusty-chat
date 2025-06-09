use axum::{
    extract::{Query, Request, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::{
    handlers::{extract_user_id, convert_auth_error},
    models::UserResponse,
    AppState,
};

#[derive(Deserialize)]
pub struct SearchQuery {
    q: String,
    limit: Option<i64>,
}

pub async fn get_current_user(
    State(state): State<AppState>,
    request: Request,
) -> Result<Json<UserResponse>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request).map_err(convert_auth_error)?;

    match state.services.user.get_user_by_id(user_id).await {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn search_users(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, Json<Value>)> {
    let limit = query.limit.unwrap_or(10).min(50);

    match state.services.user.search_users(&query.q, limit).await {
        Ok(users) => Ok(Json(users)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}
