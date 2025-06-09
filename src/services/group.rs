use crate::{
    database::Database,
    models::{AddMemberRequest, CreateGroupRequest, GroupResponse, GroupOwner, GroupMemberResponse, GroupMemberUser, GroupRole},
};
use anyhow::{anyhow, Result};
use sqlx::Row;
use uuid::Uuid;

#[derive(Clone)]
pub struct GroupService {
    db: Database,
}

impl GroupService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn get_user_groups(&self, user_id: Uuid) -> Result<Vec<GroupResponse>> {
        let rows = sqlx::query(
            "SELECT 
                g.id, g.name, g.description, g.avatar_url, g.created_at,
                u.id as owner_id, u.username as owner_username, u.avatar_url as owner_avatar,
                COUNT(gm.user_id) as member_count
             FROM groups g
             JOIN users u ON g.owner_id = u.id
             JOIN group_members gm ON g.id = gm.group_id
             WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = $1)
             GROUP BY g.id, u.id"
        )
        .bind(user_id)
        .fetch_all(self.db.pool())
        .await?;

        let mut groups = Vec::new();
        for row in rows {
            let group = GroupResponse {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                avatar_url: row.get("avatar_url"),
                owner: GroupOwner {
                    id: row.get("owner_id"),
                    username: row.get("owner_username"),
                    avatar_url: row.get("owner_avatar"),
                },
                member_count: row.get("member_count"),
                created_at: row.get("created_at"),
            };
            groups.push(group);
        }

        Ok(groups)
    }

    pub async fn create_group(&self, user_id: Uuid, request: CreateGroupRequest) -> Result<GroupResponse> {
        let group_id = Uuid::new_v4();
        
        // Create group
        sqlx::query(
            "INSERT INTO groups (id, name, description, owner_id) VALUES ($1, $2, $3, $4)"
        )
        .bind(group_id)
        .bind(&request.name)
        .bind(&request.description)
        .bind(user_id)
        .execute(self.db.pool())
        .await?;

        // Add owner as member
        sqlx::query(
            "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'owner')"
        )
        .bind(group_id)
        .bind(user_id)
        .execute(self.db.pool())
        .await?;

        // Get owner info
        let owner = sqlx::query("SELECT id, username, avatar_url FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(self.db.pool())
            .await?;

        Ok(GroupResponse {
            id: group_id,
            name: request.name,
            description: request.description,
            avatar_url: None,
            owner: GroupOwner {
                id: owner.get("id"),
                username: owner.get("username"),
                avatar_url: owner.get("avatar_url"),
            },
            member_count: 1,
            created_at: chrono::Utc::now(),
        })
    }

    pub async fn add_member(&self, user_id: Uuid, group_id: Uuid, request: AddMemberRequest) -> Result<()> {
        // Check if user is owner or admin
        let user_role = sqlx::query(
            "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2"
        )
        .bind(group_id)
        .bind(user_id)
        .fetch_optional(self.db.pool())
        .await?;

        let role: Option<GroupRole> = user_role.map(|row| row.get("role"));
        
        match role {
            Some(GroupRole::Owner) | Some(GroupRole::Admin) => {},
            _ => return Err(anyhow!("Insufficient permissions")),
        }

        // Find user by email
        let target_user = sqlx::query("SELECT id FROM users WHERE email = $1")
            .bind(&request.user_email)
            .fetch_optional(self.db.pool())
            .await?
            .ok_or_else(|| anyhow!("User not found"))?;

        let target_user_id: Uuid = target_user.get("id");

        // Check if user is already a member
        let existing_member = sqlx::query(
            "SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2"
        )
        .bind(group_id)
        .bind(target_user_id)
        .fetch_optional(self.db.pool())
        .await?;

        if existing_member.is_some() {
            return Err(anyhow!("User is already a member"));
        }

        // Add member
        sqlx::query(
            "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')"
        )
        .bind(group_id)
        .bind(target_user_id)
        .execute(self.db.pool())
        .await?;

        Ok(())
    }

    pub async fn remove_member(&self, user_id: Uuid, group_id: Uuid, target_user_id: Uuid) -> Result<()> {
        // Check if user is owner or admin
        let user_role = sqlx::query(
            "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2"
        )
        .bind(group_id)
        .bind(user_id)
        .fetch_optional(self.db.pool())
        .await?;

        let role: Option<GroupRole> = user_role.map(|row| row.get("role"));
        
        match role {
            Some(GroupRole::Owner) | Some(GroupRole::Admin) => {},
            _ => return Err(anyhow!("Insufficient permissions")),
        }

        // Cannot remove owner
        let target_role = sqlx::query(
            "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2"
        )
        .bind(group_id)
        .bind(target_user_id)
        .fetch_optional(self.db.pool())
        .await?;

        if let Some(target_role_row) = target_role {
            let target_role: GroupRole = target_role_row.get("role");
            if matches!(target_role, GroupRole::Owner) {
                return Err(anyhow!("Cannot remove group owner"));
            }
        }

        // Remove member
        let result = sqlx::query(
            "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2"
        )
        .bind(group_id)
        .bind(target_user_id)
        .execute(self.db.pool())
        .await?;

        if result.rows_affected() == 0 {
            return Err(anyhow!("Member not found"));
        }

        Ok(())
    }

    pub async fn get_group_members(&self, user_id: Uuid, group_id: Uuid) -> Result<Vec<GroupMemberResponse>> {
        // Check if user is a member
        let is_member = sqlx::query(
            "SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2"
        )
        .bind(group_id)
        .bind(user_id)
        .fetch_optional(self.db.pool())
        .await?;

        if is_member.is_none() {
            return Err(anyhow!("Access denied"));
        }

        let rows = sqlx::query(
            "SELECT 
                gm.id, gm.role, gm.joined_at,
                u.id as user_id, u.username, u.email, u.avatar_url, u.is_online
             FROM group_members gm
             JOIN users u ON gm.user_id = u.id
             WHERE gm.group_id = $1
             ORDER BY gm.joined_at"
        )
        .bind(group_id)
        .fetch_all(self.db.pool())
        .await?;

        let mut members = Vec::new();
        for row in rows {
            let member = GroupMemberResponse {
                id: row.get("id"),
                user: GroupMemberUser {
                    id: row.get("user_id"),
                    username: row.get("username"),
                    email: row.get("email"),
                    avatar_url: row.get("avatar_url"),
                    is_online: row.get("is_online"),
                },
                role: row.get("role"),
                joined_at: row.get("joined_at"),
            };
            members.push(member);
        }

        Ok(members)
    }
}
