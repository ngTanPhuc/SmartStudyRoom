package com.aiot.backend.repository;

import com.aiot.backend.entity.Command;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommandRepository extends JpaRepository<Command, String> {
    List<Command> findByUser_Id(String userId);
    Optional<Command> findByIdAndUser_Id(String commandId, String userId);

    @Modifying
    @Query("delete from Command c where c.autoRule.id = :ruleId")
    void deleteByAutoRuleId(@Param("ruleId") String ruleId);
}
