use crate::{
    database::Database,
    models::{FriendRequest, FriendResponse, FriendUser, FriendshipStatus, SendFriendRequestRequest},
};
use anyhow::{anyhow, Result};
use sqlx::Row;
use uuid::Uuid;

#[derive(Clone)]
pub struct FriendService {
    db: Database,
}

impl FriendService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn get_friends(&self, user_id: Uuid) -> Result<Vec<FriendResponse>> {
        let rows = sqlx::query(
            "SELECT 
                f.id, f.status, f.created_at,
                u.id as friend_id, u.username, u.email, u.avatar_url, u.is_online, u.last_seen
             FROM friendships f
             JOIN users u ON (
                 CASE 
                     WHEN f.user_id = $1 THEN u.id = f.friend_id
                     ELSE u.id = f.user_id
                 END
             )
             WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'"
        )
        .bind(user_id)
        .fetch_all(self.db.pool())
        .await?;

        let mut friends = Vec::new();
        for row in rows {
            let friend = FriendResponse {
                id: row.get("id"),
                user: FriendUser {
                    id: row.get("friend_id"),
                    username: row.get("username"),
                    email: row.get("email"),
                    avatar_url: row.get("avatar_url"),
                    is_online: row.get("is_online"),
                    last_seen: row.get("last_seen"),
                },
                status: row.get("status"),
                created_at: row.get("created_at"),
            };
            friends.push(friend);
        }

        Ok(friends)
    }

    pub async fn send_friend_request(&self, user_id: Uuid, request: SendFriendRequestRequest) -> Result<FriendRequest> {
        // Find the target user by email
        let target_user = sqlx::query("SELECT id, username, email, avatar_url, is_online, last_seen FROM users WHERE email = $1")
            .bind(&request.friend_email)
            .fetch_optional(self.db.pool())
            .await?
            .ok_or_else(|| anyhow!("User not found"))?;

        let friend_id: Uuid = target_user.get("id");

        if user_id == friend_id {
            return Err(anyhow!("Cannot send friend request to yourself"));
        }

        // Check if friendship already exists
        let existing = sqlx::query(
            "SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)"
        )
        .bind(user_id)
        .bind(friend_id)
        .fetch_optional(self.db.pool())
        .await?;

        if existing.is_some() {
            return Err(anyhow!("Friendship already exists"));
        }

        // Create friend request
        let friendship_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO friendships (id, user_id, friend_id, status) VALUES ($1, $2, $3, 'pending')"
        )
        .bind(friendship_id)
        .bind(user_id)
        .bind(friend_id)
        .execute(self.db.pool())
        .await?;

        // Get sender info
        let sender = sqlx::query("SELECT id, username, email, avatar_url, is_online, last_seen FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(self.db.pool())
            .await?;

        Ok(FriendRequest {
            id: friendship_id,
            from_user: FriendUser {
                id: sender.get("id"),
                username: sender.get("username"),
                email: sender.get("email"),
                avatar_url: sender.get("avatar_url"),
                is_online: sender.get("is_online"),
                last_seen: sender.get("last_seen"),
            },
            to_user: FriendUser {
                id: target_user.get("id"),
                username: target_user.get("username"),
                email: target_user.get("email"),
                avatar_url: target_user.get("avatar_url"),
                is_online: target_user.get("is_online"),
                last_seen: target_user.get("last_seen"),
            },
            status: FriendshipStatus::Pending,
            created_at: chrono::Utc::now(),
        })
    }

    pub async fn accept_friend_request(&self, user_id: Uuid, friendship_id: Uuid) -> Result<()> {
        let result = sqlx::query(
            "UPDATE friendships SET status = 'accepted' WHERE id = $1 AND friend_id = $2 AND status = 'pending'"
        )
        .bind(friendship_id)
        .bind(user_id)
        .execute(self.db.pool())
        .await?;

        if result.rows_affected() == 0 {
            return Err(anyhow!("Friend request not found or already processed"));
        }

        Ok(())
    }

    pub async fn reject_friend_request(&self, user_id: Uuid, friendship_id: Uuid) -> Result<()> {
        let result = sqlx::query(
            "DELETE FROM friendships WHERE id = $1 AND friend_id = $2 AND status = 'pending'"
        )
        .bind(friendship_id)
        .bind(user_id)
        .execute(self.db.pool())
        .await?;

        if result.rows_affected() == 0 {
            return Err(anyhow!("Friend request not found"));
        }

        Ok(())
    }

    pub async fn remove_friend(&self, user_id: Uuid, friend_id: Uuid) -> Result<()> {
        let result = sqlx::query(
            "DELETE FROM friendships WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) AND status = 'accepted'"
        )
        .bind(user_id)
        .bind(friend_id)
        .execute(self.db.pool())
        .await?;

        if result.rows_affected() == 0 {
            return Err(anyhow!("Friendship not found"));
        }

        Ok(())
    }

    pub async fn get_pending_requests(&self, user_id: Uuid) -> Result<Vec<FriendRequest>> {
        let rows = sqlx::query(
            "SELECT 
                f.id, f.created_at,
                u1.id as from_id, u1.username as from_username, u1.email as from_email, 
                u1.avatar_url as from_avatar, u1.is_online as from_online, u1.last_seen as from_last_seen,
                u2.id as to_id, u2.username as to_username, u2.email as to_email,
                u2.avatar_url as to_avatar, u2.is_online as to_online, u2.last_seen as to_last_seen
             FROM friendships f
             JOIN users u1 ON f.user_id = u1.id
             JOIN users u2 ON f.friend_id = u2.id
             WHERE f.friend_id = $1 AND f.status = 'pending'"
        )
        .bind(user_id)
        .fetch_all(self.db.pool())
        .await?;

        let mut requests = Vec::new();
        for row in rows {
            let request = FriendRequest {
                id: row.get("id"),
                from_user: FriendUser {
                    id: row.get("from_id"),
                    username: row.get("from_username"),
                    email: row.get("from_email"),
                    avatar_url: row.get("from_avatar"),
                    is_online: row.get("from_online"),
                    last_seen: row.get("from_last_seen"),
                },
                to_user: FriendUser {
                    id: row.get("to_id"),
                    username: row.get("to_username"),
                    email: row.get("to_email"),
                    avatar_url: row.get("to_avatar"),
                    is_online: row.get("to_online"),
                    last_seen: row.get("to_last_seen"),
                },
                status: FriendshipStatus::Pending,
                created_at: row.get("created_at"),
            };
            requests.push(request);
        }

        Ok(requests)
    }
}
