# 驾校报名与学员管理系统

基于 Spring Boot、MySQL、JPA 的驾校报名与学员管理系统，包含学员端、教练端和驾校管理员端。

## 功能

- 学员注册、登录和在线报名
- 身份证照片、体检表图片上传与回显
- 报名自动初审、管理员复审
- 教练推荐与分配
- 学习进度、约课、考试报名和成绩管理
- 统计图表与材料预览打印

## 运行环境

- JDK 17
- Maven
- MySQL 8.x

## 启动方式

先配置 MySQL 账号密码：

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的MySQL密码"
mvn spring-boot:run
```

然后访问：

```text
http://localhost:8080/
```

系统会自动连接 `driving_school` 数据库，并通过 JPA 自动建表。

## 协作开发

其他用户可以通过 GitHub fork 仓库后提交 Pull Request，或者由仓库管理员在 GitHub 的 `Settings -> Collaborators` 中添加协作者。
