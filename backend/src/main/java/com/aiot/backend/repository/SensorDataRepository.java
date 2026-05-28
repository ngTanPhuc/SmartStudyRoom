package com.aiot.backend.repository;

import com.aiot.backend.entity.SensorData;
import com.aiot.backend.entity.SensorDataId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, SensorDataId> {
    List<SensorData> findById_SensorIdOrderById_TimestampDesc(String sensorId);
    List<SensorData> findTop2ById_SensorIdOrderById_TimestampDesc(String sensorId);
    Optional<SensorData> findTopById_SensorIdOrderById_TimestampDesc(String sensorId);

    @Modifying
    @Query("""
            delete from SensorData data
            where data.id.sensorId = :sensorId
            and data.id.timestamp between :from and :to
            """)
    int deleteBySensorIdAndTimestampBetween(
            @Param("sensorId") String sensorId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Modifying
    @Query("""
            delete from SensorData data
            where data.id.sensorId = :sensorId
            and data.id.timestamp <= :to
            """)
    int deleteBySensorIdAndTimestampBeforeOrEqual(
            @Param("sensorId") String sensorId,
            @Param("to") LocalDateTime to);

    @Modifying
    @Query("""
            delete from SensorData data
            where data.id.sensorId = :sensorId
            and data.id.timestamp >= :from
            """)
    int deleteBySensorIdAndTimestampAfterOrEqual(
            @Param("sensorId") String sensorId,
            @Param("from") LocalDateTime from);

    @Modifying
    @Query("""
            delete from SensorData data
            where data.id.sensorId = :sensorId
            """)
    int deleteBySensorId(@Param("sensorId") String sensorId);
}
