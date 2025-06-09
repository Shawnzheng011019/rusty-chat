use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};

use crate::{
    models::{AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest},
    AppState,
};

pub async fn register(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<Value>)> {
    match state.services.auth.register(request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<Value>)> {
    match state.services.auth.login(request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(request): Json<RefreshTokenRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<Value>)> {
    match state.services.auth.refresh_token(request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}
