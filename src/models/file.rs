use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct File {
    pub id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub file_type: String,
    pub file_size: i64,
    pub file_path: String,
    pub uploader_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileResponse {
    pub id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub file_type: String,
    pub file_size: i64,
    pub url: String,
    pub created_at: DateTime<Utc>,
}

impl File {
    pub fn to_response(&self, base_url: &str) -> FileResponse {
        FileResponse {
            id: self.id,
            filename: self.filename.clone(),
            original_filename: self.original_filename.clone(),
            file_type: self.file_type.clone(),
            file_size: self.file_size,
            url: format!("{}/api/files/{}", base_url, self.id),
            created_at: self.created_at,
        }
    }
}
