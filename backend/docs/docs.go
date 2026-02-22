// Package docs is a placeholder for swagger generated documentation.
// Run `make swagger` or `swag init -g cmd/server/main.go -o docs` to generate.
package docs

// SwaggerInfo holds exported Swagger Info so clients can modify it.
var SwaggerInfo = struct {
	Version     string
	Host        string
	BasePath    string
	Schemes     []string
	Title       string
	Description string
}{
	Version:     "1.0",
	Host:        "localhost:8080",
	BasePath:    "/api/v1",
	Schemes:     []string{"http", "https"},
	Title:       "Golid API",
	Description: "Golid API",
}
