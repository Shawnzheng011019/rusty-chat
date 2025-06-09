use axum::{
    extract::{Path, Request, State},
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    handlers::extract_user_id,
    models::{AddMemberRequest, CreateGroupRequest, GroupResponse, GroupMemberResponse},
    AppState,
};

pub async fn get_groups(
    State(state): State<AppState>,
    request: Request,
) -> Result<Json<Vec<GroupResponse>>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request)?;

    match state.services.group.get_user_groups(user_id).await {
        Ok(groups) => Ok(Json(groups)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn create_group(
    State(state): State<AppState>,
    request: Request,
    Json(req): Json<CreateGroupRequest>,
) -> Result<Json<GroupResponse>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request)?;

    match state.services.group.create_group(user_id, req).await {
        Ok(group) => Ok(Json(group)),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn add_member(
    State(state): State<AppState>,
    Path(group_id): Path<Uuid>,
    request: Request,
    Json(req): Json<AddMemberRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request)?;

    match state.services.group.add_member(user_id, group_id, req).await {
        Ok(_) => Ok(Json(json!({ "message": "Member added successfully" }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn remove_member(
    State(state): State<AppState>,
    Path((group_id, member_user_id)): Path<(Uuid, Uuid)>,
    request: Request,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request)?;

    match state.services.group.remove_member(user_id, group_id, member_user_id).await {
        Ok(_) => Ok(Json(json!({ "message": "Member removed successfully" }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

pub async fn get_group_members(
    State(state): State<AppState>,
    Path(group_id): Path<Uuid>,
    request: Request,
) -> Result<Json<Vec<GroupMemberResponse>>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request)?;

    match state.services.group.get_group_members(user_id, group_id).await {
        Ok(members) => Ok(Json(members)),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}
