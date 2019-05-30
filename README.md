es-hook
===================================
加在client的http接口前, 拦截响应后做处理

## 功能
- _update 通知哪些doc被修改

### start
`npm start xxx.json`

### 最好和caddy结合使用

- 由于从外部进来的请求一定是`/`开头, 约定`@`作为`rewrite`转发前缀
- `proxy`仅支持前缀匹配, 复杂转发逻辑全放在`rewrite`里

```
:9280 {
  log stdout
  rewrite / {
    if {path} ends_with "_update"
    to @update{path}
  }
  proxy @update localhost:9201 {
    without @update
  }
  proxy / localhost:9200
}
```
