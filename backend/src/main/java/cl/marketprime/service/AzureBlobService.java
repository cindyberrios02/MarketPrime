package cl.marketprime.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

@Service
public class AzureBlobService {

    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name}")
    private String containerName;

    private BlobContainerClient containerClient;

    @PostConstruct
    public void init() {
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
        
        containerClient = blobServiceClient.getBlobContainerClient(containerName);
        
        // Create container if it doesn't exist
        if (!containerClient.exists()) {
            containerClient.create();
            // In a real production scenario with private containers, 
            // you'd set public access policies. For now, assuming standard setup.
        }
    }

    public String uploadImage(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate a unique filename
        String blobName = UUID.randomUUID().toString() + extension;
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        // Upload the file
        blobClient.upload(file.getInputStream(), file.getSize(), true);

        // Set Content-Type (important for browsers to render images instead of downloading)
        BlobHttpHeaders headers = new BlobHttpHeaders();
        String contentType = file.getContentType();
        if (contentType == null || contentType.isEmpty()) {
            // Fallback for WebP if not provided
            contentType = extension.equalsIgnoreCase(".webp") ? "image/webp" : "image/jpeg";
        }
        headers.setContentType(contentType);
        blobClient.setHttpHeaders(headers);

        // Return the public URL
        return blobClient.getBlobUrl();
    }
}
