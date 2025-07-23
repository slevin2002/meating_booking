# Meeting Booking API - Real-time Status

This document describes the backend API endpoints for real-time employee status checking.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently, the API doesn't require authentication for testing purposes.

## Endpoints

### 1. Real-time Status Endpoints

#### Get All Employees Real-time Status

```
GET /api/status/all-employees
```

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format (defaults to current date)
- `time` (optional): Time in HH:MM format (defaults to current time)

**Response:**

```json
{
  "checkDate": "2025-07-19",
  "checkTime": "15:27",
  "totalEmployees": 10,
  "busyEmployees": 3,
  "freeEmployees": 7,
  "employeeStatuses": [
    {
      "name": "John Doe",
      "status": "busy",
      "meetings": [
        {
          "title": "Team Standup",
          "startTime": "15:00",
          "endTime": "15:30",
          "teamName": "Development Team",
          "room": "meeting room (Capacity: 10)"
        }
      ]
    }
  ],
  "timestamp": "2025-07-19T15:27:00.000Z"
}
```

#### Get Employee Real-time Status

```
GET /api/status/employee/:employeeName
```

**Path Parameters:**

- `employeeName`: Name of the employee

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format
- `time` (optional): Time in HH:MM format

**Response:**

```json
{
  "employee": "John Doe",
  "checkDate": "2025-07-19",
  "checkTime": "15:27",
  "status": "busy",
  "currentMeetings": [
    {
      "id": "meeting_id",
      "title": "Team Standup",
      "description": "Daily team meeting",
      "startTime": "15:00",
      "endTime": "15:30",
      "teamName": "Development Team",
      "room": "meeting room (Capacity: 10)",
      "duration": 30
    }
  ],
  "totalMeetings": 1,
  "timestamp": "2025-07-19T15:27:00.000Z"
}
```

#### Get Team Real-time Status

```
GET /api/status/team/:teamId
```

**Path Parameters:**

- `teamId`: MongoDB ObjectId of the team

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format
- `time` (optional): Time in HH:MM format

**Response:**

```json
{
  "team": {
    "id": "team_id",
    "name": "Development Team",
    "color": "#667eea",
    "project": "Web Application",
    "lead": "John Doe"
  },
  "checkDate": "2025-07-19",
  "checkTime": "15:27",
  "totalMembers": 5,
  "busyMembers": 3,
  "freeMembers": 2,
  "memberStatuses": [
    {
      "name": "John Doe",
      "status": "busy",
      "meetings": [
        {
          "title": "Team Standup",
          "startTime": "15:00",
          "endTime": "15:30",
          "teamName": "Development Team",
          "room": "meeting room (Capacity: 10)"
        }
      ]
    }
  ],
  "timestamp": "2025-07-19T15:27:00.000Z"
}
```

#### Get Current Meetings Summary

```
GET /api/status/current-meetings
```

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format
- `time` (optional): Time in HH:MM format

**Response:**

```json
{
  "checkDate": "2025-07-19",
  "checkTime": "15:27",
  "totalMeetings": 2,
  "totalAttendees": 8,
  "meetingsByRoom": {
    "meeting room (Capacity: 10)": [
      {
        "id": "meeting_id_1",
        "title": "Team Standup",
        "teamName": "Development Team",
        "startTime": "15:00",
        "endTime": "15:30",
        "attendees": ["John Doe", "Jane Smith"],
        "attendeesCount": 2
      }
    ],
    "Balcony (Capacity: 8)": [
      {
        "id": "meeting_id_2",
        "title": "Project Review",
        "teamName": "Design Team",
        "startTime": "15:15",
        "endTime": "16:15",
        "attendees": ["Alice Johnson", "Bob Wilson"],
        "attendeesCount": 2
      }
    ]
  },
  "timestamp": "2025-07-19T15:27:00.000Z"
}
```

### 2. Enhanced Meeting Endpoints

#### Check Member Availability (Enhanced)

```
GET /api/meetings/check-member-availability
```

**Query Parameters:**

- `member`: Employee name
- `date`: Date in YYYY-MM-DD format
- `startTime`: Start time in HH:MM format
- `endTime`: End time in HH:MM format

#### Get Member Meetings (Enhanced)

```
GET /api/meetings/member-meetings
```

**Query Parameters:**

- `member`: Employee name
- `date` (optional): Date in YYYY-MM-DD format

#### Get Real-time Status (Legacy)

```
GET /api/meetings/real-time-status
```

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format
- `time` (optional): Time in HH:MM format

#### Get Employee Current Meetings (Legacy)

```
GET /api/meetings/employee-current-meetings
```

**Query Parameters:**

- `employee`: Employee name
- `date` (optional): Date in YYYY-MM-DD format
- `time` (optional): Time in HH:MM format

## Testing

### Run Test Script

```bash
cd backend
node test-status.js
```

This will test all the real-time status functionality and show:

1. Current meetings
2. Test meetings (July 19, 2025 at 15:27)
3. All employees
4. Employee status at test time
5. Current employee status

### Test with cURL

#### Test All Employees Status

```bash
curl "http://localhost:5000/api/status/all-employees?date=2025-07-19&time=15:27"
```

#### Test Specific Employee

```bash
curl "http://localhost:5000/api/status/employee/John%20Doe?date=2025-07-19&time=15:27"
```

#### Test Current Meetings

```bash
curl "http://localhost:5000/api/status/current-meetings"
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP Status Codes:

- `200`: Success
- `400`: Bad Request (missing parameters)
- `404`: Not Found (employee/team not found)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

The API includes rate limiting:

- 100 requests per 15 minutes per IP
- Returns 429 status code when exceeded

## Data Models

### Meeting Schema

```javascript
{
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  teamId: ObjectId,
  teamName: String,
  attendees: [String],
  room: String,
  status: String, // "scheduled", "completed", "cancelled"
  isRecurring: Boolean,
  createdBy: ObjectId
}
```

### Team Schema

```javascript
{
  name: String,
  color: String,
  members: [String],
  lead: String,
  project: String,
  status: String // "active", "completed", "on-hold"
}
```

## Notes

- All times are handled in the server's local timezone
- Employee names are matched exactly (case-sensitive)
- Cancelled meetings are excluded from status checks
- The API automatically uses current date/time if not provided
- All responses include a timestamp for debugging
