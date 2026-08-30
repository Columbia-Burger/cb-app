package com.columbiaburger.business.service;

import com.columbiaburger.business.dto.response.OrderEventResponse;
import com.columbiaburger.business.dto.response.OrderResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class OrderEventService {

    private static final long TIMEOUT_MS = 30L * 60L * 1000L;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(error -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void publishCreated(OrderResponse order) {
        publish("ORDER_CREATED", order);
    }

    public void publishUpdated(OrderResponse order) {
        publish("ORDER_UPDATED", order);
    }

    public void publishInvoiced(OrderResponse order) {
        publish("ORDER_INVOICED", order, true);
    }

    private void publish(String type, OrderResponse order) {
        publish(type, order, false);
    }

    private void publish(String type, OrderResponse order, boolean printAtAdmin) {
        OrderEventResponse event = OrderEventResponse.builder()
                .type(type)
                .order(order)
                .printAtAdmin(printAtAdmin)
                .build();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(type).data(event));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
    }
}
