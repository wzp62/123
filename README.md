# music-suggestions — 说明

新增内容：
- 后端 server.js：一个简单的 Express 服务，用于保存每次推荐后的 session 以及该 session 下的评分数据到本地文件 ratings.db.json。启动后端后，前端会把评分发送到该服务并持久化。
- query_ratings.js：在终端查询评分数据的脚本。

快速开始：
1. 安装依赖：
   npm install
2. 启动后端：
   npm start
   服务器默认监听 http://localhost:3000
3. 打开 index.html（浏览器访问或直接打开文件），在页面上推荐并刷新以生成 session，然后对歌曲评分。
4. 在终端查看会话：
   - 列出所有 session：
     node query_ratings.js
   - 查看某个 session 详细评分：
     node query_ratings.js <sessionId>

注意：如果未启动后端，前端仍然可本地运行，但评分会保存在内存中的本地 session（无法被终端查询）。
