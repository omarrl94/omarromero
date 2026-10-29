import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Sesión 0 · Primera llamada a un LLM local (Ollama) desde Java 21, sin dependencias.
 * Ejecuta: java HolaIA.java "tu pregunta"
 */
public class HolaIA {

    record Peticion(String modelo, String sistema, String pregunta) {
        String json() {
            return """
                {"model": "%s", "stream": false, "messages": [
                  {"role": "system", "content": "%s"},
                  {"role": "user", "content": "%s"}]}
                """.formatted(escapar(modelo), escapar(sistema), escapar(pregunta));
        }
    }

    static String escapar(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    /** Extrae el texto de "message.content" de la respuesta de /api/chat (en M3 usaremos Jackson). */
    static String contenido(String json) {
        int clave = json.indexOf("\"content\"");
        if (clave < 0) throw new IllegalStateException("Respuesta inesperada: " + json);
        int i = json.indexOf('"', json.indexOf(':', clave) + 1) + 1;
        var sb = new StringBuilder();
        for (; i < json.length() && json.charAt(i) != '"'; i++) {
            char c = json.charAt(i);
            if (c != '\\') { sb.append(c); continue; }
            char e = json.charAt(++i);
            switch (e) {
                case 'n' -> sb.append('\n');
                case 't' -> sb.append('\t');
                case 'u' -> { sb.append((char) Integer.parseInt(json.substring(i + 1, i + 5), 16)); i += 4; }
                default -> sb.append(e);      // \" \\ \/
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) throws Exception {
        var url = System.getenv().getOrDefault("OLLAMA_URL", "http://localhost:11434") + "/api/chat";
        var modelo = System.getenv().getOrDefault("MODELO_LOCAL", "qwen2.5:1.5b");
        var peticion = new Peticion(modelo, "Eres un tutor de IA. Responde en español en 3 frases.",
                args.length > 0 ? String.join(" ", args) : "¿Qué diferencia hay entre entrenamiento e inferencia?");

        try (var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofMinutes(2))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(peticion.json()))
                    .build();
            long inicio = System.nanoTime();
            var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                System.err.println("Ollama respondió " + resp.statusCode() + ": " + resp.body());
                System.exit(1);
            }
            System.out.println(contenido(resp.body()));
            System.out.printf("%n[%s] %.1f s%n", modelo, (System.nanoTime() - inicio) / 1e9);
        } catch (java.net.ConnectException e) {
            System.err.println("No hay conexión con Ollama en " + url + ". ¿Está arrancado?");
            System.exit(1);
        }
    }
}
