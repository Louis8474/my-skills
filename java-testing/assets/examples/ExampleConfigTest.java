package com.example.app.config;

import static org.assertj.core.api.Assertions.tuple;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.assertj.core.api.WithAssertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExampleConfigTest implements WithAssertions {

    @InjectMocks
    private ExampleConfig exampleConfig;

    @Test
    void shouldReturnCorrectDTOsWhenValidConfig() {
        // Given
        ReflectionTestUtils.setField(exampleConfig, "configProperty", "key1:value1:10,key2:value2:20");

        // When
        List<ExampleConfigDTO> result = exampleConfig.parseConfiguration();

        // Then
        assertThat(result)
                .isNotNull()
                .hasSize(2)
                .extracting("key", "value", "number")
                .containsExactly(
                        tuple("key1", "value1", 10),
                        tuple("key2", "value2", 20)
                );
    }

    @ParameterizedTest
    @ValueSource(strings = { "invalid", "key1:value1", "key1:value1:notanumber" })
    void shouldReturnEmptyListWhenInvalidConfig(String invalidConfig) {
        // Given
        ReflectionTestUtils.setField(exampleConfig, "configProperty", invalidConfig);

        // When
        List<ExampleConfigDTO> result = exampleConfig.parseConfiguration();

        // Then
        assertThat(result)
                .isNotNull()
                .isEmpty();
    }

    @ParameterizedTest
    @NullAndEmptySource
    void shouldReturnEmptyListWhenConfigIsNullOrEmpty(String config) {
        // Given
        ReflectionTestUtils.setField(exampleConfig, "configProperty", config);

        // When
        List<ExampleConfigDTO> result = exampleConfig.parseConfiguration();

        // Then
        assertThat(result)
                .isNotNull()
                .isEmpty();
    }

    @Test
    void shouldParseDecimalValuesCorrectly() {
        // Given
        ReflectionTestUtils.setField(exampleConfig, "decimalProperty", "0.15,0.25,0.35");

        // When
        List<BigDecimal> result = exampleConfig.parseDecimals();

        // Then
        assertThat(result)
                .hasSize(3)
                .containsExactly(
                        new BigDecimal("0.15"),
                        new BigDecimal("0.25"),
                        new BigDecimal("0.35")
                );
    }

    static class ExampleConfig {
        private String configProperty;
        private String decimalProperty;

        List<ExampleConfigDTO> parseConfiguration() {
            if (configProperty == null || configProperty.trim().isEmpty()) {
                return Collections.emptyList();
            }

            List<ExampleConfigDTO> result = new ArrayList<>();
            String[] entries = configProperty.split(",");
            for (String entry : entries) {
                String[] parts = entry.split(":");
                if (parts.length != 3) {
                    return Collections.emptyList();
                }
                try {
                    result.add(new ExampleConfigDTO(parts[0], parts[1], Integer.parseInt(parts[2])));
                } catch (NumberFormatException ex) {
                    return Collections.emptyList();
                }
            }
            return result;
        }

        List<BigDecimal> parseDecimals() {
            if (decimalProperty == null || decimalProperty.trim().isEmpty()) {
                return Collections.emptyList();
            }

            List<BigDecimal> result = new ArrayList<>();
            String[] values = decimalProperty.split(",");
            for (String value : values) {
                result.add(new BigDecimal(value));
            }
            return result;
        }
    }

    static class ExampleConfigDTO {
        private final String key;
        private final String value;
        private final int number;

        ExampleConfigDTO(String key, String value, int number) {
            this.key = key;
            this.value = value;
            this.number = number;
        }

        String getKey() { return key; }
        String getValue() { return value; }
        int getNumber() { return number; }
    }
}
