package com.uj.diploma.dtos;

public class WebSocketMessageDto {
    private String batchId;
    private int seq;
    private int totalInBatch;
    private long clientTime;
    private long serverTime;
    private long latency;

    public WebSocketMessageDto(String batchId, int seq, int totalInBatch, long clientTime, long serverTime, long latency) {
        this.batchId = batchId;
        this.seq = seq;
        this.totalInBatch = totalInBatch;
        this.clientTime = clientTime;
        this.serverTime = serverTime;
        this.latency = latency;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public int getSeq() {
        return seq;
    }

    public void setSeq(int seq) {
        this.seq = seq;
    }

    public int getTotalInBatch() {
        return totalInBatch;
    }

    public void setTotalInBatch(int totalInBatch) {
        this.totalInBatch = totalInBatch;
    }

    public long getClientTime() {
        return clientTime;
    }

    public void setClientTime(long clientTime) {
        this.clientTime = clientTime;
    }

    public long getServerTime() {
        return serverTime;
    }

    public void setServerTime(long serverTime) {
        this.serverTime = serverTime;
    }

    public long getLatency() {
        return latency;
    }

    public void setLatency(long latency) {
        this.latency = latency;
    }
}