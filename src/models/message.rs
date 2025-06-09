use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Message {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub chat_id: Uuid,
    pub content: Option<String>,
    pub message_type: MessageType,
    pub file_id: Option<Uuid>,
    pub reply_to: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "message_type", rename_all = "lowercase")]
pub enum MessageType {
    Text,
    Image,
    Video,
    Audio,
    File,
    Voice,
    Emoji,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageResponse {
    pub id: Uuid,
    pub sender: MessageSender,
    pub chat_id: Uuid,
    pub content: Option<String>,
    pub message_type: MessageType,
    pub file: Option<MessageFile>,
    pub reply_to: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageSender {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageFile {
    pub id: Uuid,
    pub filename: String,
    pub file_type: String,
    pub file_size: i64,
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub chat_id: Uuid,
    pub content: Option<String>,
    pub message_type: MessageType,
    pub file_id: Option<Uuid>,
    pub reply_to: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TypingIndicator {
    pub chat_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub is_typing: bool,
}
