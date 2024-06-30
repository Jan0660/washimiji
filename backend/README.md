# backend

## `config.json`

```json
{
    "address": ":8080",
    "tokens": ["token1", "token2"],
    "mongoUrl": "...",
    "mongoDatabase": "washimiji",
    "paths": {
        "customCharacters": "../character-maker/custom-characters.json",
        "characterMakerOutput": "../character-maker/out",
        "staticServe": "./static",
        "makeCharacters": "./scripts/make-characters.sh",
        "makeFont": "./scripts/make-font.sh",
        "makeFontConfig": "../font-maker/kanjivg-config.json"
    },
    "accessControlAllowOrigin": ["*"],
    "convertBodyLimit": 64000
}
```

All config options are required.

- `address` - The adress the HTTP server will listen on.
- `tokens` - Array of tokens that can be used to access endpoints that require authentication.
- `mongoUrl` - [MongoDB connection string](https://www.mongodb.com/docs/manual/reference/connection-string/)
- `mongoDatabase` - Name of the database to use, will be created if it does not already exist.
- `paths` Paths to different parts of the Washimiji project.
    All the example values above are valid as long as you run the backend in this directory.
- `accessControlAllowOrigin` - Values for the `Access-Control-Allow-Origin` header. Set to `["*"]` to allow all origins. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) for more info. If multiple origins are provided the one that matches the `Origin` header will be sent on the requests.
- `convertBodyLimit` - Maximum length of the request body accepted by the `/convert/*` endpoints.
    So the real maximum length of the `text` field is a little lower than this.
