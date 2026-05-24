package com.example.app.handler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import org.assertj.core.api.WithAssertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExampleHandlerTest implements WithAssertions {

    @Mock
    private ExampleProcessor processor;

    @Mock
    private ExampleAuditLogger auditLogger;

    @InjectMocks
    private ExampleHandler handler;

    @Test
    void shouldCaptureProcessedDataWhenHandle() {
        // Given
        ExampleInput input = new ExampleInput("testId", "testData");
        ArgumentCaptor<ProcessedData> captor = ArgumentCaptor.forClass(ProcessedData.class);

        // When
        handler.handle(input);

        // Then
        verify(processor).process(captor.capture());
        ProcessedData captured = captor.getValue();
        assertThat(captured.getId()).isEqualTo("testId");
        assertThat(captured.getData()).isEqualTo("PROCESSED_testData");
    }

    @Test
    void shouldLogAuditEventWhenHandle() {
        // Given
        ExampleInput input = new ExampleInput("testId", "testData");
        ArgumentCaptor<AuditEvent> auditCaptor = ArgumentCaptor.forClass(AuditEvent.class);

        // When
        handler.handle(input);

        // Then
        verify(auditLogger).log(auditCaptor.capture());
        AuditEvent auditEvent = auditCaptor.getValue();
        assertThat(auditEvent.getAction()).isEqualTo("HANDLE");
        assertThat(auditEvent.getEntityId()).isEqualTo("testId");
    }

    @Test
    void shouldPropagateExceptionWhenProcessorThrows() {
        // Given
        ExampleInput input = new ExampleInput("testId", "testData");
        doThrow(new RuntimeException("Processing failed")).when(processor).process(any());

        // When / Then
        assertThatThrownBy(() -> handler.handle(input))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Processing failed");
    }

    @Test
    void shouldThrowIllegalArgumentExceptionWhenInvalidInput() {
        // Given
        ExampleInput invalidInput = new ExampleInput(null, "testData");

        // When / Then
        assertThatThrownBy(() -> handler.handle(invalidInput))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("id cannot be null");
    }

    static class ExampleInput {
        private final String id;
        private final String data;

        ExampleInput(String id, String data) {
            this.id = id;
            this.data = data;
        }

        String getId() { return id; }
        String getData() { return data; }
    }

    static class ProcessedData {
        private final String id;
        private final String data;

        ProcessedData(String id, String data) {
            this.id = id;
            this.data = data;
        }

        String getId() { return id; }
        String getData() { return data; }
    }

    static class AuditEvent {
        private final String action;
        private final String entityId;

        AuditEvent(String action, String entityId) {
            this.action = action;
            this.entityId = entityId;
        }

        String getAction() { return action; }
        String getEntityId() { return entityId; }
    }

    interface ExampleProcessor {
        void process(ProcessedData data);
    }

    interface ExampleAuditLogger {
        void log(AuditEvent event);
    }

    static class ExampleHandler {
        private final ExampleProcessor processor;
        private final ExampleAuditLogger auditLogger;

        ExampleHandler(ExampleProcessor processor, ExampleAuditLogger auditLogger) {
            this.processor = processor;
            this.auditLogger = auditLogger;
        }

        void handle(ExampleInput input) {
            if (input.getId() == null) {
                throw new IllegalArgumentException("id cannot be null");
            }
            ProcessedData processedData = new ProcessedData(input.getId(), "PROCESSED_" + input.getData());
            processor.process(processedData);
            auditLogger.log(new AuditEvent("HANDLE", input.getId()));
        }
    }
}
