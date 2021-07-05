# classdo.js

ClassDo API client for browsers and NodeJS.

[![CircleCI](https://circleci.com/gh/ClassDo/classdo-js.svg?style=svg)](https://circleci.com/gh/ClassDo/classdo-js)

## Quick Start

Install via npm

```
npm install @classdo/classdo
```

Install via yarn

```
yarn add @classdo/classdo
```

### Making requests

```js
const { ClassDoAPIClient } = require('@classdo/classdo')
const client = new ClassDoAPIClient({ accessToken: 'xxxxxxxx' })
client.viewer().then(result => {
  // fetch viewer
  console.log(result)
})
```

## Interface

All request apis accept request to fetch specified fields and related object according to our GraphQLSchema.

Like below.

```typescript
client.viewer.get(['id'], {
  rooms: { fields: ['id', 'name'] } // request to fetch rooms also
}).then(v => {
  if (v.data) {
    console.log(v.data)             // viewer
    console.log(v.data.rooms.edges) // rooms
  }
})
```

You can see our GraphQL schema details [here](https://developer.classdo.com/schema/).

## APIs

See [this document](https://developer.classdo.com/classdo-js).

## License

MIT
