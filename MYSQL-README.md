# MySQL 启动说明

系统已经改成 Spring Boot + MySQL + JPA 持久化版本。

## 默认连接

默认连接配置在 `src/main/resources/application.properties`：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/driving_school?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
spring.datasource.username=root
spring.datasource.password=
```

应用会自动创建 `driving_school` 数据库，并用 JPA 自动建表。

## PowerShell 启动方式

把下面的账号密码改成你自己的 MySQL 用户：

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的MySQL密码"
mvn spring-boot:run
```

或者运行打包后的 jar：

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的MySQL密码"
java -jar target\driving-school-system-0.0.1-SNAPSHOT.jar
```

启动成功后访问：

```text
http://localhost:8080/
```

## 如果数据库权限不足

可以先在 MySQL 中手动执行：

```sql
CREATE DATABASE IF NOT EXISTS driving_school
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

然后再启动应用。
