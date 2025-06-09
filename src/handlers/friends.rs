use axum::{
    extract::{Path, Request, State},
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    handlers::{AuthenticatedUser, extract_user_id, convert_auth_error},
    models::{FriendRequest, FriendResponse, SendFriendRequestRequest},
    AppState,
};

pub async fn get_friends(
    State(state): State<AppState>,
    request: Request,
) -> Result<Json<Vec<FriendResponse>>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request).map_err(convert_auth_error)?;

    match state.services.friend.get_friends(user_id).await {
        Ok(friends) => Ok(Json(friends)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn send_friend_request(
    State(state): State<AppState>,
    AuthenticatedUser(user_id): AuthenticatedUser,
    Json(req): Json<SendFriendRequestRequest>,
) -> Result<Json<FriendRequest>, (StatusCode, Json<Value>)> {

    match state.services.friend.send_friend_request(user_id, req).await {
        Ok(friend_request) => Ok(Json(friend_request)),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn accept_friend_request(
    State(state): State<AppState>,
    Path(request_id): Path<Uuid>,
    request: Request,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request).map_err(convert_auth_error)?;

    match state.services.friend.accept_friend_request(user_id, request_id).await {
        Ok(_) => Ok(Json(json!({ "message": "Friend request accepted" }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn reject_friend_request(
    State(state): State<AppState>,
    Path(request_id): Path<Uuid>,
    request: Request,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request).map_err(convert_auth_error)?;

    match state.services.friend.reject_friend_request(user_id, request_id).await {
        Ok(_) => Ok(Json(json!({ "message": "Friend request rejected" }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn remove_friend(
    State(state): State<AppState>,
    Path(friend_id): Path<Uuid>,
    request: Request,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request).map_err(convert_auth_error)?;

    match state.services.friend.remove_friend(user_id, friend_id).await {
        Ok(_) => Ok(Json(json!({ "message": "Friend removed" }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}
