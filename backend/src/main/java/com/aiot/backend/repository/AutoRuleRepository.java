package com.aiot.backend.repository;

import com.aiot.backend.entity.AutoRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutoRuleRepository extends JpaRepository<AutoRule, String> {
    Optional<AutoRule> findByIdAndUser_Id(String autoRuleId, String userId);
    List<AutoRule> findBySensor_Id(String sensorId);
    List<AutoRule> findByUser_IdAndDeletedAtIsNull(String userId);
    List<AutoRule> findByActiveTrueAndDeletedAtIsNull();
}
