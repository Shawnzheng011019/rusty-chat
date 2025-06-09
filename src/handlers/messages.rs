use axum::{
    extract::{Path, Query, Request, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    handlers::{extract_user_id, convert_auth_error},
    models::MessageResponse,
    AppState,
};

#[derive(Deserialize)]
pub struct MessageQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

pub async fn get_messages(
    State(state): State<AppState>,
    Path(chat_id): Path<Uuid>,
    Query(query): Query<MessageQuery>,
    request: Request,
) -> Result<Json<Vec<MessageResponse>>, (StatusCode, Json<Value>)> {
    let _user_id = extract_user_id(&request).map_err(convert_auth_error)?;
    
    let limit = query.limit.unwrap_or(50).min(100);
    let offset = query.offset.unwrap_or(0);

    match state.services.message.get_messages(chat_id, limit, offset).await {
        Ok(messages) => Ok(Json(messages)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}
