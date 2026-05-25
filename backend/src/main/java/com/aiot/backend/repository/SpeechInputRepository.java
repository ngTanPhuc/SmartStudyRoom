package com.aiot.backend.repository;

import com.aiot.backend.entity.Sensor;
import com.aiot.backend.entity.SpeechInput;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpeechInputRepository extends JpaRepository<SpeechInput, String> {
    List<SpeechInput> findByUser_Id(String userId);
    Optional<SpeechInput> findByIdAndUser_Id(String sensorId, String userId);
}
