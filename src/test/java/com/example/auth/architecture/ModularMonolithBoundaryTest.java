package com.example.auth.architecture;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ModularMonolithBoundaryTest {

    private static final Path SOURCE_ROOT = Path.of("src/main/java/com/example/auth");

    private static final Map<String, Pattern> MODULE_OWNERS = new LinkedHashMap<>();

    static {
        MODULE_OWNERS.put("identity", Pattern.compile(String.join("|",
                "^controller/(AuthController|UserController)\\.java$",
                "^dto/(AuthResponse|LoginRequest|PasswordResetRequest|RefreshTokenRequest|RegisterRequest|ResetPasswordRequest|UserResponse|VerifyEmailRequest)\\.java$",
                "^dto/(profile|settings)/.*\\.java$",
                "^entity/(AuthProvider|Role|Theme|User|UserSettings|UserStatus)\\.java$",
                "^identity/.*\\.java$",
                "^repository/(UserRepository|UserSettingsRepository)\\.java$",
                "^security/.*\\.java$",
                "^service/(AuthService|EmailService|JwtService|UserService|UserSettingsService)\\.java$"
        )));
        MODULE_OWNERS.put("workspace", Pattern.compile(String.join("|",
                "^controller/WorkspaceController\\.java$",
                "^dto/workspace/.*\\.java$",
                "^entity/(Workspace|WorkspaceMember|WorkspaceRole)\\.java$",
                "^repository/(WorkspaceRepository|WorkspaceMemberRepository)\\.java$",
                "^service/WorkspaceService\\.java$",
                "^workspace/.*\\.java$"
        )));
        MODULE_OWNERS.put("content", Pattern.compile(String.join("|",
                "^controller/(FavoriteController|MemoController|SnippetController)\\.java$",
                "^content/.*\\.java$",
                "^dto/(favorite|memo|snippet)/.*\\.java$",
                "^entity/(CodeSnippet|Favorite|FavoriteType|Memo)\\.java$",
                "^repository/(CodeSnippetRepository|FavoriteRepository|MemoRepository)\\.java$",
                "^service/(FavoriteService|MemoService|SnippetService)\\.java$"
        )));
        MODULE_OWNERS.put("chat", Pattern.compile(String.join("|",
                "^config/WebSocket.*\\.java$",
                "^chat/.*\\.java$",
                "^controller/ChatController\\.java$",
                "^dto/chat/.*\\.java$",
                "^entity/(ChatMessage|MessageType)\\.java$",
                "^event/ChatMessageCreatedEvent\\.java$",
                "^repository/ChatMessageRepository\\.java$",
                "^service/(ChatPresenceTracker|ChatService|PresenceService)\\.java$"
        )));
        MODULE_OWNERS.put("notification", Pattern.compile(String.join("|",
                "^controller/NotificationController\\.java$",
                "^dto/notification/.*\\.java$",
                "^entity/(Notification|NotificationType)\\.java$",
                "^event/ChatNotificationListener\\.java$",
                "^notification/.*\\.java$",
                "^repository/NotificationRepository\\.java$",
                "^service/NotificationService\\.java$"
        )));
        MODULE_OWNERS.put("query", Pattern.compile(String.join("|",
                "^controller/(DashboardController|SearchController)\\.java$",
                "^dto/(dashboard|search)/.*\\.java$",
                "^service/(DashboardService|SearchService)\\.java$"
        )));
        MODULE_OWNERS.put("platform", Pattern.compile(String.join("|",
                "^AuthApplication\\.java$",
                "^config/(AsyncConfig|FileStorageConfig|JwtConfig|MailAsyncProperties|SecurityConfig)\\.java$",
                "^exception/.*\\.java$",
                "^service/FileStorageService\\.java$",
                "^service/RedisService\\.java$",
                "^service/mail/.*\\.java$"
        )));
    }

    @Test
    void allBackendClassesHaveAPlannedModuleOwner() throws IOException {
        try (Stream<Path> files = Files.walk(SOURCE_ROOT)) {
            StringBuilder unmapped = new StringBuilder();

            files.filter(path -> path.toString().endsWith(".java"))
                    .map(SOURCE_ROOT::relativize)
                    .map(path -> path.toString().replace('\\', '/'))
                    .forEach(sourcePath -> {
                        Optional<String> owner = MODULE_OWNERS.entrySet().stream()
                                .filter(entry -> entry.getValue().matcher(sourcePath).matches())
                                .map(Map.Entry::getKey)
                                .findFirst();

                        if (owner.isEmpty()) {
                            unmapped.append(System.lineSeparator()).append(" - ").append(sourcePath);
                        }
                    });

            assertTrue(unmapped.isEmpty(),
                    "Every backend class must be assigned to a modular monolith owner:" + unmapped);
        }
    }

    @Test
    void refactoredCrossModuleServicesUsePortsInsteadOfForeignRepositories() throws IOException {
        List<Path> refactoredSources = List.of(
                SOURCE_ROOT.resolve("service/ChatService.java"),
                SOURCE_ROOT.resolve("service/MemoService.java"),
                SOURCE_ROOT.resolve("service/SnippetService.java"),
                SOURCE_ROOT.resolve("service/SearchService.java"),
                SOURCE_ROOT.resolve("service/DashboardService.java"),
                SOURCE_ROOT.resolve("service/FavoriteService.java"),
                SOURCE_ROOT.resolve("service/NotificationService.java"),
                SOURCE_ROOT.resolve("service/PresenceService.java"),
                SOURCE_ROOT.resolve("event/ChatNotificationListener.java")
        );

        List<String> forbiddenImports = List.of(
                "import com.example.auth.repository.UserRepository;",
                "import com.example.auth.repository.WorkspaceRepository;",
                "import com.example.auth.repository.WorkspaceMemberRepository;",
                "import com.example.auth.service.WorkspaceService;",
                "import com.example.auth.service.NotificationService;",
                "import com.example.auth.notification.NotificationPublisher;",
                "import com.example.auth.entity.NotificationType;"
        );

        StringBuilder violations = new StringBuilder();
        for (Path source : refactoredSources) {
            String content = Files.readString(source);
            forbiddenImports.stream()
                    .filter(content::contains)
                    .forEach(forbiddenImport -> violations
                            .append(System.lineSeparator())
                            .append(" - ")
                            .append(SOURCE_ROOT.relativize(source).toString().replace('\\', '/'))
                            .append(" imports ")
                            .append(forbiddenImport));
        }

        assertTrue(violations.isEmpty(),
                "Refactored cross-module services must use internal ports instead of foreign repositories:"
                        + violations);
    }

    @Test
    void queryServicesUseReadPortsInsteadOfWriteModelRepositories() throws IOException {
        List<Path> querySources = List.of(
                SOURCE_ROOT.resolve("service/SearchService.java"),
                SOURCE_ROOT.resolve("service/DashboardService.java")
        );

        List<String> forbiddenImports = List.of(
                "import com.example.auth.repository.ChatMessageRepository;",
                "import com.example.auth.repository.CodeSnippetRepository;",
                "import com.example.auth.repository.MemoRepository;",
                "import com.example.auth.repository.*;"
        );

        StringBuilder violations = new StringBuilder();
        for (Path source : querySources) {
            String content = Files.readString(source);
            forbiddenImports.stream()
                    .filter(content::contains)
                    .forEach(forbiddenImport -> violations
                            .append(System.lineSeparator())
                            .append(" - ")
                            .append(SOURCE_ROOT.relativize(source).toString().replace('\\', '/'))
                            .append(" imports ")
                            .append(forbiddenImport));
        }

        assertTrue(violations.isEmpty(),
                "Query services must use chat/content read ports instead of write-model repositories:"
                        + violations);
    }

    @Test
    void notificationCommandContractDoesNotDependOnApplicationInternals() throws IOException {
        Path contractRoot = SOURCE_ROOT.resolve("notification/contract");
        List<String> forbiddenImports = List.of(
                "import com.example.auth.dto.",
                "import com.example.auth.entity.",
                "import com.example.auth.repository.",
                "import com.example.auth.service."
        );

        StringBuilder violations = new StringBuilder();
        try (Stream<Path> files = Files.walk(contractRoot)) {
            files.filter(path -> path.toString().endsWith(".java"))
                    .forEach(source -> {
                        try {
                            String content = Files.readString(source);
                            forbiddenImports.stream()
                                    .filter(content::contains)
                                    .forEach(forbiddenImport -> violations
                                            .append(System.lineSeparator())
                                            .append(" - ")
                                            .append(SOURCE_ROOT.relativize(source).toString().replace('\\', '/'))
                                            .append(" imports ")
                                            .append(forbiddenImport));
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
        }

        assertTrue(violations.isEmpty(),
                "Notification command contracts must stay serializable and independent from app internals:"
                        + violations);
    }
}
