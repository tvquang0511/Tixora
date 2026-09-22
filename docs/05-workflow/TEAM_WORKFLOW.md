## Workflow tóm tắt

## Branch policy:
- `main` chỉ chứa code sẵn sàng deploy
- `develop` cho tích lũy feature (nếu áp dụng)
- Feature branches theo quy ước trong CONTRIBUTING.md

## Issue Labels:

### Type Labels

| Label             | Mô tả ngắn                                    |
| ----------------- | --------------------------------------------- |
| `bug`             | System defect or unexpected behavior          |
| `critical-bug`    | Critical issue affecting core functionality   |
| `hotfix`          | Urgent production fix                         |
| `blocked`         | Task is blocked by dependency                 |
| `dependency`      | Depends on another service or team            |
| `technical-debt`  | Long-term maintainability improvement         |
| `refactor`        | Improve code structure without changing logic |
| `performance`     | Performance issue or optimization             |
| `security`        | Security-related issue or enhancement         |
| `documentation`   | Documentation improvement or update           |
| `task`            | General task or feature development           |

### Component Labels

| Label             | Mô tả ngắn                                    |
| ----------------- | --------------------------------------------- |
| `backend`         | Backend development task                      |
| `frontend`        | Frontend/UI related task                      |
| `database`        | Database related work                         |
| `devops`          | Infrastructure or deployment task             |
| `ui-ux`           | UI/UX improvement or design task              |
| `api`             | API development or integration                |
| `testing`         | Testing or QA related task                    |

### Priority Labels

| Label             | Mô tả ngắn                                    |
| ----------------- | --------------------------------------------- |
| `low-priority`    | Low impact, can wait                          |
| `medium-priority` | Medium importance                             |
| `high-priority`   | High importance and impact                    |
| `urgent`          | Requires immediate attention                  |

## Project Management:
- Phân chia kế hoạch theo từng sprint. Mỗi sprint sẽ được tạo một issue epic để tổng hợp các task liên quan. Các task trong sprint được tạo bằng cách dùng subisssue hoặc liên kết issue với epic.
- Các task sẽ được trưởng nhóm phân chia cho từng thành viên. Với mỗi nhánh được tạo ra sẽ được gắn với 1 issue cụ thể. Chỉ merge vào khi task hoàn thành và đã được review. Các lỗi phải được fix trên nhánh trước khi merge vào main.
- Với mỗi issue được tạo ra cần được sử dụng đủ 3 labels về type, component và priority. Điều này giúp cho việc quản lý và theo dõi tiến độ công việc dễ dàng hơn. Các issue sẽ được sắp xếp theo priority để đảm bảo rằng các task quan trọng được xử lý trước.
- Khi đã hoàn thành task và pass CI, cần tạo PR và gắn link issue vào PR và sử dụng theo mẫu template đã được tạo sẵn trong `docs/pr_template.md`. PR sẽ được review bởi ít nhất 1 reviewer trước khi merge vào main.
- Với mỗi PR chỉ cần sử dụng refs đến issues để tránh close khi merge một PR vào main hoặc dev. Chỉ đóng issues khi hoàn thành full task của issues đó thôi.