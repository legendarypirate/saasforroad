# Brigada Module ERD

```mermaid
erDiagram
  users ||--o{ brigades : "leads"
  users ||--o{ brigade_members : "member"
  brigades ||--o{ brigade_members : "has"
  brigades ||--o{ brigade_equipment : "owns"
  equipments ||--o{ brigade_equipment : "linked"
  brigades ||--o{ hire_requests : "hired via"
  projects ||--o{ hire_requests : "needs"
  users ||--o{ hire_requests : "requested_by"
  hire_requests ||--o{ hire_request_history : "history"
  brigades ||--o{ brigade_reviews : "rated"
  hire_requests ||--o| brigade_reviews : "after complete"
  projects ||--o{ brigade_reviews : "on project"
  users ||--o{ brigade_reviews : "reviewer"
  brigades ||--o{ brigade_documents : "docs"
  brigades ||--o{ brigade_timeline_events : "timeline"
  brigades ||--o{ brigade_progress_reports : "daily"
  projects ||--o{ brigade_progress_reports : "for"
  users ||--o{ brigade_notifications : "receives"
  brigades ||--o{ brigade_notifications : "about"

  brigades {
    int id PK
    string name
    string logo
    int leader_user_id FK
    string province
    string location
    string availability
    string status
    decimal average_rating
    decimal reputation_score
    jsonb skills
  }

  brigade_members {
    int id PK
    int brigade_id FK
    int user_id FK
    string position
    jsonb skills
    decimal attendance_rate
    string status
  }

  hire_requests {
    int id PK
    int brigade_id FK
    int project_id FK
    string status
    date start_date
    date end_date
    string priority
    jsonb required_skills
  }

  brigade_reviews {
    int id PK
    int brigade_id FK
    int hire_request_id FK
    decimal overall_rating
    decimal quality
    decimal safety
    decimal speed
    decimal communication
  }

  hire_request_history {
    int id PK
    int hire_request_id FK
    string from_status
    string to_status
  }

  brigade_documents {
    int id PK
    int brigade_id FK
    string title
    string doc_type
    string file_url
  }

  brigade_timeline_events {
    int id PK
    int brigade_id FK
    string event_type
    string title
  }

  brigade_progress_reports {
    int id PK
    int brigade_id FK
    int project_id FK
    date report_date
    text work_completed
    int worker_count
  }

  brigade_notifications {
    int id PK
    int user_id FK
    int brigade_id FK
    string type
    boolean is_read
  }
```

## Reputation formula

```
score =
  40% × (average_rating / 5 × 100)
+ 20% × min(completed_tasks / 50 × 100, 100)
+ 15% × completion_rate
+ 10% × safety_score
+ 10% × attendance_score
+  5% × response_time_score (faster = higher)
```

Result clamped to **0–100**.
