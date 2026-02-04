# 单个文件解析
## 创建解析任务
### 接口说明
适用于通过 API 创建解析任务的场景，用户须先申请 Token。 注意：
- 单个文件大小不能超过 200MB,文件页数不超出 600 页
- 每个账号每天享有 2000 页最高优先级解析额度，超过 2000 页的部分优先级降低
- 因网络限制，github、aws 等国外 URL 会请求超时
- 该接口不支持文件直接上传
- header头中需要包含 Authorization 字段，格式为 Bearer + 空格 + Token

CURL 请求示例（适用于pdf、doc、ppt、图片文件）：
```code
curl --location --request POST 'https://mineru.net/api/v4/extract/task' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "model_version": "vlm"
}'
```

## 获取任务结果
### 接口说明
通过 task_id 查询提取任务目前的进度，任务处理完成后，接口会响应对应的提取详情。
CURL 请求示例：
```code
curl --location --request GET 'https://mineru.net/api/v4/extract/task/{task_id}' \
--header 'Authorization: Bearer *****' \
--header 'Accept: */*'
```

# 批量文件解析
## 文件批量上传解析
### 接口说明
适用于本地文件上传解析的场景，可通过此接口批量申请文件上传链接，上传文件后，系统会自动提交解析任务 注意：
- 申请的文件上传链接有效期为 24 小时，请在有效期内完成文件上传
- 上传文件时，无须设置 Content-Type 请求头
- 文件上传完成后，无须调用提交解析任务接口。系统会自动扫描已上传完成文件自动提交解析任务
- 单次申请链接不能超过 200 个
- header头中需要包含 Authorization 字段，格式为 Bearer + 空格 + Token
CURL 请求示例（适用于pdf、doc、ppt、图片文件）：
```code
curl --location --request POST 'https://mineru.net/api/v4/file-urls/batch' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "files": [
        {"name":"demo.pdf", "data_id": "abcd"}
    ],
    "model_version": "vlm"
}'
```

## url 批量上传解析
### 接口说明
适用于通过 API 批量创建提取任务的场景 注意：
- 单次申请链接不能超过 200 个
- 文件大小不能超过 200MB,文件页数不超出 600 页
- 因网络限制，github、aws 等国外 URL 会请求超时
- header头中需要包含 Authorization 字段，格式为 Bearer + 空格 + Token
CURL 请求示例（适用于pdf、doc、ppt、图片文件）：
```code
curl --location --request POST 'https://mineru.net/api/v4/extract/task/batch' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "files": [
        {"url":"https://cdn-mineru.openxlab.org.cn/demo/example.pdf", "data_id": "abcd"}
    ],
    "model_version": "vlm"
}'
```

## 批量获取任务结果
### 接口说明
通过 batch_id 批量查询提取任务的进度。
CURL 请求示例
```code
curl --location --request GET 'https://mineru.net/api/v4/extract-results/batch/{batch_id}' \
--header 'Authorization: Bearer *****' \
--header 'Accept: */*'
```