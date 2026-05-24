package com.example.app.cache;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.assertj.core.api.WithAssertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExampleCacheTest implements WithAssertions {

    private static final long EVENT_ID = 12L;
    private static final long FEED_ID = 11L;

    private ExampleCache exampleCache;

    @Mock
    private ExampleRestClient restClient;

    @Mock
    private MetricService metricService;

    @BeforeEach
    void setup() {
        this.exampleCache = new ExampleCache(restClient, 5, metricService);
    }

    @Test
    void shouldCallRestClientOnceWhenCacheHit() {
        // Given
        CacheData expectedData = new CacheData(EVENT_ID, "cachedValue");
        when(restClient.fetchData(EVENT_ID, FEED_ID)).thenReturn(expectedData);

        // When
        CacheData response1 = exampleCache.getData(EVENT_ID, FEED_ID);
        CacheData response2 = exampleCache.getData(EVENT_ID, FEED_ID);
        CacheData response3 = exampleCache.getData(EVENT_ID, FEED_ID);

        // Then
        verify(restClient, times(1)).fetchData(EVENT_ID, FEED_ID);
        assertThat(response1).isEqualTo(expectedData);
        assertThat(response2).isEqualTo(expectedData);
        assertThat(response3).isEqualTo(expectedData);
    }

    @Test
    void shouldCallRestClientForEachKeyWhenDifferentKeys() {
        // Given
        CacheData data1 = new CacheData(1L, "value1");
        CacheData data2 = new CacheData(2L, "value2");
        when(restClient.fetchData(1L, FEED_ID)).thenReturn(data1);
        when(restClient.fetchData(2L, FEED_ID)).thenReturn(data2);

        // When
        exampleCache.getData(1L, FEED_ID);
        exampleCache.getData(2L, FEED_ID);

        // Then
        verify(restClient, times(1)).fetchData(1L, FEED_ID);
        verify(restClient, times(1)).fetchData(2L, FEED_ID);
    }

    @Test
    void shouldReturnNewValueWhenCacheUpdated() {
        // Given
        CacheData initialData = new CacheData(EVENT_ID, "initial");
        CacheData updatedData = new CacheData(EVENT_ID, "updated");
        when(restClient.fetchData(EVENT_ID, FEED_ID)).thenReturn(initialData);

        // When
        CacheData result1 = exampleCache.getData(EVENT_ID, FEED_ID);
        exampleCache.updateCache(EVENT_ID, FEED_ID, updatedData);
        CacheData result2 = exampleCache.getData(EVENT_ID, FEED_ID);

        // Then
        assertThat(result1).isEqualTo(initialData);
        assertThat(result2).isEqualTo(updatedData);
        verify(restClient, times(1)).fetchData(EVENT_ID, FEED_ID);
    }

    @Test
    void shouldReturnCorrectSizeWhenMultipleEntries() {
        // Given
        when(restClient.fetchData(1L, FEED_ID)).thenReturn(new CacheData(1L, "v1"));
        when(restClient.fetchData(2L, FEED_ID)).thenReturn(new CacheData(2L, "v2"));

        // When
        exampleCache.getData(1L, FEED_ID);
        exampleCache.getData(2L, FEED_ID);

        // Then
        Long cacheSize = (Long) ReflectionTestUtils.invokeMethod(exampleCache, "getCacheSize");
        assertThat(cacheSize).isEqualTo(2L);
    }

    static class CacheData {
        private final long id;
        private final String value;

        CacheData(long id, String value) {
            this.id = id;
            this.value = value;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            CacheData cacheData = (CacheData) o;
            return id == cacheData.id && value.equals(cacheData.value);
        }
    }

    interface ExampleRestClient {
        CacheData fetchData(long eventId, long feedId);
    }

    interface MetricService {
        void recordCacheHit();
        void recordCacheMiss();
    }

    static class ExampleCache {
        private final ExampleRestClient restClient;
        private final int maxSize;
        private final MetricService metricService;
        private final java.util.Map<String, CacheData> internalCache = new java.util.HashMap<>();

        ExampleCache(ExampleRestClient restClient, int maxSize, MetricService metricService) {
            this.restClient = restClient;
            this.maxSize = maxSize;
            this.metricService = metricService;
        }

        CacheData getData(long eventId, long feedId) {
            String key = eventId + "-" + feedId;
            return internalCache.computeIfAbsent(key, k -> restClient.fetchData(eventId, feedId));
        }

        void updateCache(long eventId, long feedId, CacheData data) {
            String key = eventId + "-" + feedId;
            internalCache.put(key, data);
        }

        private long getCacheSize() {
            return internalCache.size();
        }
    }
}
