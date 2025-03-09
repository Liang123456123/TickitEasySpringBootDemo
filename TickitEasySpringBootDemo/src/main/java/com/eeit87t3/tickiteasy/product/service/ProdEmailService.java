package com.eeit87t3.tickiteasy.product.service;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;

import com.eeit87t3.tickiteasy.member.entity.Member;
import com.eeit87t3.tickiteasy.product.entity.ProdFavoritesEntity;
import com.eeit87t3.tickiteasy.product.entity.ProductEntity;
import com.eeit87t3.tickiteasy.product.repository.ProdFavoritesRepo;

/**
 * @author Liang123456123
 */
@Service
public class ProdEmailService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private ProdFavoritesRepo prodFavoritesRepo;

    private static final int BATCH_SIZE = 50; // 每次發送 50 封郵件

    @Transactional
    public void sendRestockNotification(ProductEntity product) {
        try {
            int offset = 0; // 記錄處理進度的變數
            List<ProdFavoritesEntity> notifyList;

            do {
                // 每次查詢最多 BATCH_SIZE 筆
                notifyList = prodFavoritesRepo.findByProductProductIDAndNotifyStatus(
                    product.getProductID(), 1);

                // 取出當前批次的資料
                List<ProdFavoritesEntity> batch = notifyList.subList(
                    offset, Math.min(offset + BATCH_SIZE, notifyList.size()));

                for (ProdFavoritesEntity notify : batch) {
                    // 取得會員資訊
                    Member member = notify.getMember();
                    
                    MimeMessage mimeMessage = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                    
                    helper.setTo(member.getEmail());
                    helper.setSubject("商品上架通知 - " + product.getProductName());
                    
                    ClassPathResource resource = new ClassPathResource("templates/product/restockNotification.html");
                    String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                    
                    content = content.replace("{{memberName}}", member.getName())
                                   .replace("{{productName}}", product.getProductName())
                                   .replace("{{productLink}}", "http://localhost:8080/TickitEasy/product/" + product.getProductID());
                    
                    helper.setText(content, true);
                    mailSender.send(mimeMessage);
                    
                    // 更新通知狀態
                    notify.setNotifyStatus(0);
                    prodFavoritesRepo.save(notify);
                    
                    // 如果收藏數量為 0，且通知狀態也是 0，則刪除該筆記錄
                    if (notify.getFavoriteCount() == 0 && notify.getNotifyStatus() == 0) {
                        prodFavoritesRepo.deleteIfCountAndNotifyAreZero(member.getMemberID(), product.getProductID());
                    }
                }

                // 增加 offset，繼續查詢下一批會員
                offset += BATCH_SIZE;

            } while (offset < notifyList.size()); // 當 offset 超過資料總數時，停止查詢

        } catch (Exception e) {
            throw new RuntimeException("發送上架通知郵件失敗", e);
        }
    }
}