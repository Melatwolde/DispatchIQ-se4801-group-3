package com.dispatchiq.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;

@SpringBootApplication(scanBasePackages = "com.dispatchiq")
public class BackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(BackendApplication.class, args);
  }

  @GetMapping("/dispatch")
  @PreAuthorize("hasRole('DISPATCHER')")
  public String dispatchGreeting() {
    return "Hello Dispatcher!";
  }
}
