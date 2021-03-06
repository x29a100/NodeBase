package level2.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import utils.Http;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Explorer implements HttpHandler {

    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        String root = "src";
        String path = httpExchange.getRequestURI().getPath();
        String allpath = root + path;

        if (new File(allpath).isDirectory()) {
            String response = "";
            File[] faFiles = new File(allpath).listFiles();
            for (File file : faFiles) {
                response += "<a href=\"" + (path.equals("/") ? "/" : path + "/") +  file.getName() + "\">" + file.getName()+ "</a><br>";
            }
            Http.Response(httpExchange, response);
        } else
            Http.Response(httpExchange, Files.readAllBytes(Paths.get(allpath)));
    }
}
