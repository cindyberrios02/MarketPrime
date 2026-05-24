package cl.marketprime.controller;

import cl.marketprime.service.AzureBlobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final AzureBlobService azureBlobService;

    @Autowired
    public UploadController(AzureBlobService azureBlobService) {
        this.azureBlobService = azureBlobService;
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
            }

            // Upload the file to Azure Blob Storage
            String imageUrl = azureBlobService.uploadImage(file);

            // Return the public URL
            return ResponseEntity.ok(Map.of("url", imageUrl));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to upload image",
                "detail", e.getClass().getSimpleName() + ": " + e.getMessage()
            ));
        }
    }
}
