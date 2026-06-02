package controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PublicController {
    @GetMapping("/public")
    public String publicEndpoint() {
        return "Public data - no auth needed";
    }

    @GetMapping("/user")
    public String userEndpoint() {
        return "User data - authenticated users only";
    }

    @GetMapping("/admin")
    public String adminEndpoint() {
        return "Admin data - admins only";
    }
}
