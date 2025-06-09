use crate::{
    database::Database,
    models::{Message, MessageResponse, MessageSender, MessageFile, SendMessageRequest},
};
use anyhow::Result;
use sqlx::Row;
use uuid::Uuid;

#[derive(Clone)]
pub struct MessageService {
    db: Database,
}

impl MessageService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn send_message(&self, sender_id: Uuid, request: SendMessageRequest) -> Result<MessageResponse> {
        let message_id = Uuid::new_v4();
        
        // Insert message
        sqlx::query(
            "INSERT INTO messages (id, sender_id, chat_id, content, message_type, file_id, reply_to) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(message_id)
        .bind(sender_id)
        .bind(request.chat_id)
        .bind(&request.content)
        .bind(&request.message_type)
        .bind(request.file_id)
        .bind(request.reply_to)
        .execute(self.db.pool())
        .await?;

        // Fetch the created message with sender info
        self.get_message_by_id(message_id).await
    }

    pub async fn get_messages(&self, chat_id: Uuid, limit: i64, offset: i64) -> Result<Vec<MessageResponse>> {
        let rows = sqlx::query(
            "SELECT 
                m.id, m.chat_id, m.content, m.message_type, m.reply_to, m.created_at,
                u.id as sender_id, u.username as sender_username, u.avatar_url as sender_avatar,
                f.id as file_id, f.filename, f.file_type, f.file_size
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             LEFT JOIN files f ON m.file_id = f.id
             WHERE m.chat_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2 OFFSET $3"
        )
        .bind(chat_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(self.db.pool())
        .await?;

        let mut messages = Vec::new();
        for row in rows {
            let message = MessageResponse {
                id: row.get("id"),
                sender: MessageSender {
                    id: row.get("sender_id"),
                    username: row.get("sender_username"),
                    avatar_url: row.get("sender_avatar"),
                },
                chat_id: row.get("chat_id"),
                content: row.get("content"),
                message_type: row.get("message_type"),
                file: if row.get::<Option<Uuid>, _>("file_id").is_some() {
                    Some(MessageFile {
                        id: row.get("file_id"),
                        filename: row.get("filename"),
                        file_type: row.get("file_type"),
                        file_size: row.get("file_size"),
                        url: format!("/api/files/{}", row.get::<Uuid, _>("file_id")),
                    })
                } else {
                    None
                },
                reply_to: row.get("reply_to"),
                created_at: row.get("created_at"),
            };
            messages.push(message);
        }

        Ok(messages)
    }

    pub async fn get_chat_participants(&self, chat_id: Uuid) -> Result<Vec<Uuid>> {
        // Check if it's a group chat
        let group_members = sqlx::query("SELECT user_id FROM group_members WHERE group_id = $1")
            .bind(chat_id)
            .fetch_all(self.db.pool())
            .await?;

        if !group_members.is_empty() {
            return Ok(group_members.into_iter().map(|row| row.get("user_id")).collect());
        }

        // If not a group, it's a direct message - get participants from recent messages
        let participants = sqlx::query(
            "SELECT DISTINCT sender_id FROM messages WHERE chat_id = $1 LIMIT 2"
        )
        .bind(chat_id)
        .fetch_all(self.db.pool())
        .await?;

        Ok(participants.into_iter().map(|row| row.get("sender_id")).collect())
    }

    async fn get_message_by_id(&self, message_id: Uuid) -> Result<MessageResponse> {
        let row = sqlx::query(
            "SELECT 
                m.id, m.chat_id, m.content, m.message_type, m.reply_to, m.created_at,
                u.id as sender_id, u.username as sender_username, u.avatar_url as sender_avatar,
                f.id as file_id, f.filename, f.file_type, f.file_size
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             LEFT JOIN files f ON m.file_id = f.id
             WHERE m.id = $1"
        )
        .bind(message_id)
        .fetch_one(self.db.pool())
        .await?;

        Ok(MessageResponse {
            id: row.get("id"),
            sender: MessageSender {
                id: row.get("sender_id"),
                username: row.get("sender_username"),
                avatar_url: row.get("sender_avatar"),
            },
            chat_id: row.get("chat_id"),
            content: row.get("content"),
            message_type: row.get("message_type"),
            file: if row.get::<Option<Uuid>, _>("file_id").is_some() {
                Some(MessageFile {
                    id: row.get("file_id"),
                    filename: row.get("filename"),
                    file_type: row.get("file_type"),
                    file_size: row.get("file_size"),
                    url: format!("/api/files/{}", row.get::<Uuid, _>("file_id")),
                })
            } else {
                None
            },
            reply_to: row.get("reply_to"),
            created_at: row.get("created_at"),
        })
    }
}
