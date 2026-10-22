import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.net.InetSocketAddress;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws Exception {
        // 0.0.0.0 cho phép nhận kết nối từ máy khác
        HttpServer server = HttpServer.create(
            new InetSocketAddress("0.0.0.0", 8080), 0
        );

        server.createContext("/api/hello", (HttpExchange exchange) -> {
            // Cho phép FE gọi khác origin (demo)
            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*"
            );
            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "GET, POST, OPTIONS"
            );
            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type"
            );

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            String response = "{\"message\":\"Hello from Java!\"}";
            byte[] body = response.getBytes(StandardCharsets.UTF_8);

            exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8"
            );
            exchange.sendResponseHeaders(200, body.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });

        server.start();
        System.out.println("Server running at http://localhost:8080");
    }
}