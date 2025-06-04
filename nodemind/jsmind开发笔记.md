

### 数据存储结构
```javascript
// 内存中的节点数据库
nodeDatabase = {
    "N001": {
        id: "N001",
        title: "节点标题",
        content: "节点内容",
        relations: { parent: null, children: ["N002", "N003"] },
        tags: { categories: [], technical: [], status: [] },
        time: "创建时间 | 修改时间",
        author: "作者"
    }
}
```
git 
开始定制
1. 节点折叠后，在该节点的后面上下两个位置显示：折叠后的层级数，折叠后所有节点数,这部分内容显示在详情页上
2. 我想对页面进行改版：
    - 左红框，是列表框，点击其中的节点，该节点作为脑图的中心节点，
    - 右红框，是节点详情页（标题，内容，创建时间，标签）