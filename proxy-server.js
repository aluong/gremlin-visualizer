const express = require("express");
const bodyParser = require("body-parser");
const gremlin = require("gremlin");
const cors = require("cors");
const app = express();
const port = 3001;

app.use(
  cors({
    credentials: true,
  })
);

// parse application/json
app.use(bodyParser.json());

function mapToObj(inputMap) {
  let obj = {};

  // inputMap.forEach((value, key) => {
  //   obj[key] = value;
  // });

  // cosmos
  for (const prop in inputMap) {
    obj[prop] = inputMap[prop][0];
  }

  return obj;
}

function edgesToJson(edgeList) {
  // return edgeList.map((edge) => ({
  //   id:
  //     typeof edge.get("id") !== "string"
  //       ? JSON.stringify(edge.get("id"))
  //       : edge.get("id"),
  //   from: edge.get("from"),
  //   to: edge.get("to"),
  //   label: edge.get("label"),
  //   properties: mapToObj(edge.get("properties")),
  // }));
  // cosmos
  return edgeList.map((edge) => ({
    id: typeof edge.id !== "string" ? JSON.stringify(edge.id) : edge.id,
    from: edge.from,
    to: edge.to,
    label: edge.label,
    properties: mapToObj(edge.properties),
  }));
}

function nodesToJson(nodeList) {
  return nodeList.map((node) => ({
    id: node.id,
    label: node.label,
    properties: mapToObj(node.properties),
    edges: edgesToJson(node.edges),
  }));
}

function makeQuery(query, nodeLimit) {
  // const nodeLimitQuery =
  //   !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${nodeLimit})` : "";
  // return `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap().by(__.unfold())).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap().by(__.unfold())).fold())`;

  // cosmos
  const nodeLimitQuery =
    !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${nodeLimit})` : "";
  // return `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap().by(__.unfold())).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap().by(__.unfold())).fold())`;
  return `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap()).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap()).fold())`;
}

app.post("/query", (req, res, next) => {
  const gremlinHost = req.body.host;
  const gremlinPort = req.body.port;
  const nodeLimit = req.body.nodeLimit;
  const query = req.body.query;

  // const client = new gremlin.driver.Client(`ws://localhost:8182/gremlin`, {
  //   traversalSource: "g",
  //   mimeType: "application/json",
  // });

  // cosmos
  const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
    '/dbs/<DB ID>/colls/<Graph ID>',
    "<PRIMARY KEY>"
  );
  const client = new gremlin.driver.Client(
    'wss://<COSMOS ID>.gremlin.cosmos.azure.com:443/',
    {
      authenticator,
      traversalsource: "g",
      rejectUnauthorized: true,
      mimeType: "application/vnd.gremlin-v2.0+json",
    }
  );

  client
    .submit(makeQuery(query, nodeLimit), {})
    .then((result) => res.send(nodesToJson(result._items)))
    .catch((err) => next(err));
});

app.listen(port, () =>
  console.log(`Simple gremlin-proxy server listening on port ${port}!`)
);
