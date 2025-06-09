use crate::{
    database::Database,
    models::{File, FileResponse},
};
use anyhow::{anyhow, Result};
use mime_guess;
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

#[derive(Clone)]
pub struct FileService {
    db: Database,
    upload_dir: String,
}

impl FileService {
    pub fn new(db: Database, upload_dir: String) -> Self {
        Self { db, upload_dir }
    }

    pub async fn save_file(
        &self,
        uploader_id: Uuid,
        filename: &str,
        content: &[u8],
    ) -> Result<FileResponse> {
        // Create upload directory if it doesn't exist
        fs::create_dir_all(&self.upload_dir).await?;

        // Generate unique filename
        let file_id = Uuid::new_v4();
        let extension = Path::new(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        let stored_filename = if extension.is_empty() {
            file_id.to_string()
        } else {
            format!("{}.{}", file_id, extension)
        };

        let file_path = format!("{}/{}", self.upload_dir, stored_filename);

        // Determine file type
        let file_type = mime_guess::from_path(filename)
            .first_or_octet_stream()
            .to_string();

        // Save file to disk
        fs::write(&file_path, content).await?;

        // Save file metadata to database
        sqlx::query(
            "INSERT INTO files (id, filename, original_filename, file_type, file_size, file_path, uploader_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(file_id)
        .bind(&stored_filename)
        .bind(filename)
        .bind(&file_type)
        .bind(content.len() as i64)
        .bind(&file_path)
        .bind(uploader_id)
        .execute(self.db.pool())
        .await?;

        Ok(FileResponse {
            id: file_id,
            filename: stored_filename,
            original_filename: filename.to_string(),
            file_type,
            file_size: content.len() as i64,
            url: format!("/api/files/{}", file_id),
            created_at: chrono::Utc::now(),
        })
    }

    pub async fn get_file(&self, file_id: Uuid) -> Result<(File, Vec<u8>)> {
        let file = sqlx::query_as::<_, File>("SELECT * FROM files WHERE id = $1")
            .bind(file_id)
            .fetch_optional(self.db.pool())
            .await?
            .ok_or_else(|| anyhow!("File not found"))?;

        let content = fs::read(&file.file_path).await?;

        Ok((file, content))
    }

    pub async fn delete_file(&self, file_id: Uuid, user_id: Uuid) -> Result<()> {
        let file = sqlx::query_as::<_, File>(
            "SELECT * FROM files WHERE id = $1 AND uploader_id = $2"
        )
        .bind(file_id)
        .bind(user_id)
        .fetch_optional(self.db.pool())
        .await?
        .ok_or_else(|| anyhow!("File not found or access denied"))?;

        // Delete from database
        sqlx::query("DELETE FROM files WHERE id = $1")
            .bind(file_id)
            .execute(self.db.pool())
            .await?;

        // Delete from disk
        if let Err(e) = fs::remove_file(&file.file_path).await {
            tracing::warn!("Failed to delete file from disk: {}", e);
        }

        Ok(())
    }

    pub fn is_image(&self, file_type: &str) -> bool {
        file_type.starts_with("image/")
    }

    pub fn is_video(&self, file_type: &str) -> bool {
        file_type.starts_with("video/")
    }

    pub fn is_audio(&self, file_type: &str) -> bool {
        file_type.starts_with("audio/")
    }
}
