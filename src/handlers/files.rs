use axum::{
    body::Bytes,
    extract::{Multipart, Path, Request, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    handlers::extract_user_id,
    models::FileResponse,
    AppState,
};

pub async fn upload_file(
    State(state): State<AppState>,
    request: Request,
    mut multipart: Multipart,
) -> Result<Json<FileResponse>, (StatusCode, Json<Value>)> {
    let user_id = extract_user_id(&request)?;

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "file" {
            let filename = field.file_name().unwrap_or("unknown").to_string();
            let data = field.bytes().await.unwrap();

            // Check file size
            if data.len() > state.config.max_file_size {
                return Err((
                    StatusCode::PAYLOAD_TOO_LARGE,
                    Json(json!({ "error": "File too large" })),
                ));
            }

            match state.services.file.save_file(user_id, &filename, &data).await {
                Ok(file_response) => return Ok(Json(file_response)),
                Err(e) => return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": e.to_string() })),
                )),
            }
        }
    }

    Err((
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": "No file provided" })),
    ))
}

pub async fn download_file(
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> Result<Response, (StatusCode, Json<Value>)> {
    match state.services.file.get_file(file_id).await {
        Ok((file, content)) => {
            let headers = [
                (header::CONTENT_TYPE, file.file_type.as_str()),
                (header::CONTENT_DISPOSITION, &format!("attachment; filename=\"{}\"", file.original_filename)),
                (header::CONTENT_LENGTH, &content.len().to_string()),
            ];

            Ok((headers, content).into_response())
        }
        Err(_) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "File not found" })),
        )),
    }
}
