package com.example.app.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.assertj.core.api.WithAssertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExampleServiceTest implements WithAssertions {

    @Mock
    private ExampleRepository repository;

    @Mock
    private ExampleMapper mapper;

    @InjectMocks
    private ExampleService exampleService;

    @Test
    void shouldReturnProcessedResultWhenValidInput() {
        // Given
        String input = "testInput";
        String repositoryResult = "rawData";
        String expectedOutput = "processedData";
        when(repository.findByName(input)).thenReturn(repositoryResult);
        when(mapper.transform(repositoryResult)).thenReturn(expectedOutput);

        // When
        String result = exampleService.process(input);

        // Then
        assertThat(result).isEqualTo(expectedOutput);
        verify(repository).findByName(input);
        verify(mapper).transform(repositoryResult);
    }

    @Test
    void shouldReturnNullWhenInputIsNull() {
        // Given
        String input = null;

        // When
        String result = exampleService.process(input);

        // Then
        assertThat(result).isNull();
        verify(repository, never()).findByName(any());
        verify(mapper, never()).transform(any());
    }

    @Test
    void shouldNotCallMapperWhenRepositoryReturnsNull() {
        // Given
        String input = "nonExistent";
        when(repository.findByName(input)).thenReturn(null);

        // When
        String result = exampleService.process(input);

        // Then
        assertThat(result).isNull();
        verify(repository).findByName(input);
        verify(mapper, never()).transform(any());
    }

    interface ExampleRepository {
        String findByName(String name);
    }

    interface ExampleMapper {
        String transform(String input);
    }

    static class ExampleService {
        private final ExampleRepository repository;
        private final ExampleMapper mapper;

        ExampleService(ExampleRepository repository, ExampleMapper mapper) {
            this.repository = repository;
            this.mapper = mapper;
        }

        String process(String input) {
            if (input == null) {
                return null;
            }
            String data = repository.findByName(input);
            if (data == null) {
                return null;
            }
            return mapper.transform(data);
        }
    }
}
