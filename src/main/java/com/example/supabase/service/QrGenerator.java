package com.example.supabase.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

@Component
public class QrGenerator {

    /** Devuelve un PNG del QR como data URI listo para usar en <img src="..."> */
    public String generarDataUri(String contenido, int size) {
        byte[] png = generarPng(contenido, size);
        if (png.length == 0) return "";
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
    }

    /** Devuelve los bytes PNG del QR (útil para adjuntar inline en emails con cid:). */
    public byte[] generarPng(String contenido, int size) {
        try {
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.MARGIN, 1,
                    EncodeHintType.CHARACTER_SET, "UTF-8"
            );
            BitMatrix matrix = new MultiFormatWriter()
                    .encode(contenido, BarcodeFormat.QR_CODE, size, size, hints);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            return new byte[0];
        }
    }
}
