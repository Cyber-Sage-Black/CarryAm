import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { calculateDeliveryPricing, CARRYAM_THEME } from '@carryam/shared';

export default function MobileHomeScreen() {
  const [role, setRole] = useState<'sender' | 'carrier'>('sender');
  const [stage, setStage] = useState<'MATCHED' | 'AGREEMENT' | 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'DELIVERED'>('MATCHED');
  const [bounty, setBounty] = useState('2500');
  const [handoverOtp, setHandoverOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const SECRET_HANDOVER_OTP = '4819';
  const SECRET_DELIVERY_OTP = '9102';

  const bountyNaira = parseInt(bounty, 10) || 0;
  const pricing = calculateDeliveryPricing(bountyNaira * 100, 2500000);

  const verifyHandover = () => {
    if (handoverOtp !== SECRET_HANDOVER_OTP) {
      setErrorMsg(`Invalid OTP. Use demo code: ${SECRET_HANDOVER_OTP}`);
      return;
    }
    setErrorMsg('');
    setStage('IN_TRANSIT');
  };

  const verifyDelivery = () => {
    if (deliveryOtp !== SECRET_DELIVERY_OTP) {
      setErrorMsg(`Invalid OTP. Use demo code: ${SECRET_DELIVERY_OTP}`);
      return;
    }
    setErrorMsg('');
    setStage('DELIVERED');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Brand Header Banner: Sky Blue + Gold Trim */}
      <View style={styles.banner}>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>⭐ GOLD VERIFIED CORRIDOR</Text>
        </View>
        <Text style={styles.bannerTitle}>CarryAm Logistics</Text>
        <Text style={styles.bannerSubtitle}>Lagos (Berger) ⇄ Ibadan (Iwo Road)</Text>
      </View>

      {/* Role Switcher */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, role === 'sender' && styles.toggleBtnActive]}
          onPress={() => setRole('sender')}
        >
          <Text style={[styles.toggleText, role === 'sender' && styles.toggleTextActive]}>
            Sender View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, role === 'carrier' && styles.toggleBtnActive]}
          onPress={() => setRole('carrier')}
        >
          <Text style={[styles.toggleText, role === 'carrier' && styles.toggleTextActive]}>
            Traveler View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Corridor Route Card: White Card with Gold Lining */}
      <View style={styles.goldCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>Corridor Trajectory</Text>
          <Text style={styles.statusPill}>5km Buffer</Text>
        </View>
        
        <View style={styles.routeRow}>
          <Text style={styles.routeIcon}>📍</Text>
          <View>
            <Text style={styles.routeLabel}>PICKUP (DEPARTURE)</Text>
            <Text style={styles.routeCity}>TotalEnergies, Berger (Lagos)</Text>
          </View>
        </View>
        
        <View style={styles.routeDivider} />
        
        <View style={styles.routeRow}>
          <Text style={styles.routeIcon}>🏁</Text>
          <View>
            <Text style={styles.routeLabel}>DROPOFF (DESTINATION)</Text>
            <Text style={styles.routeCity}>Iwo Road Interchange (Ibadan)</Text>
          </View>
        </View>
      </View>

      {/* Agreement & Escrow Funding Card */}
      <View style={styles.goldCard}>
        <Text style={styles.cardHeader}>Agreement-First Escrow</Text>
        <Text style={styles.cardDesc}>
          Payment is debited only after traveler accepts terms. Held in vault until recipient gives delivery OTP.
        </Text>

        <Text style={styles.inputLabel}>Traveler Bounty (₦):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={bounty}
          onChangeText={setBounty}
        />

        <View style={styles.feeBreakdown}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Carrier Net Earnings:</Text>
            <Text style={styles.feeValue}>₦{pricing.carrierBountyNaira.toLocaleString()}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform Take (18%):</Text>
            <Text style={styles.feeValue}>₦{(pricing.platformFeeKobo / 100).toLocaleString()}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Micro-Guarantee Reserve:</Text>
            <Text style={styles.feeValue}>₦{(pricing.protectionFeeKobo / 100).toLocaleString()}</Text>
          </View>
          <View style={[styles.feeRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Escrow Deposit:</Text>
            <Text style={styles.totalValue}>₦{pricing.totalSenderChargeNaira.toLocaleString()}</Text>
          </View>
        </View>

        {/* Action Button by Lifecycle Stage */}
        {stage === 'MATCHED' && (
          <TouchableOpacity 
            style={styles.actionButtonSky}
            onPress={() => setStage('AGREEMENT')}
          >
            <Text style={styles.actionButtonText}>Step 1: Sign & Accept Mutual Agreement</Text>
          </TouchableOpacity>
        )}

        {stage === 'AGREEMENT' && (
          <TouchableOpacity 
            style={styles.actionButtonGold}
            onPress={() => setStage('ESCROW_FUNDED')}
          >
            <Text style={styles.actionButtonTextDark}>Step 2: Pay ₦{pricing.totalSenderChargeNaira.toLocaleString()} to Escrow</Text>
          </TouchableOpacity>
        )}

        {stage === 'ESCROW_FUNDED' && (
          <View style={styles.fundedAlert}>
            <Text style={styles.fundedAlertTitle}>✅ Escrow Funded & Locked!</Text>
            <Text style={styles.fundedAlertText}>
              Sender Handover OTP: <Text style={styles.boldText}>{SECRET_HANDOVER_OTP}</Text>. Give this to the traveler at Berger pickup.
            </Text>
          </View>
        )}
      </View>

      {/* Dual-OTP Physical Handshake Execution */}
      {(stage === 'ESCROW_FUNDED' || stage === 'IN_TRANSIT' || stage === 'DELIVERED') && (
        <View style={styles.goldCard}>
          <Text style={styles.cardHeader}>Dual-OTP Handshake & Seal</Text>

          {errorMsg !== '' && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          {stage === 'ESCROW_FUNDED' && (
            <View>
              <Text style={styles.inputLabel}>Enter 4-Digit Handover OTP (from Sender):</Text>
              <TextInput
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={4}
                placeholder={`Try: ${SECRET_HANDOVER_OTP}`}
                value={handoverOtp}
                onChangeText={setHandoverOtp}
              />
              <TouchableOpacity 
                style={styles.actionButtonSky}
                onPress={verifyHandover}
              >
                <Text style={styles.actionButtonText}>Confirm Pickup & Depart</Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === 'IN_TRANSIT' && (
            <View>
              <View style={styles.transitAlert}>
                <Text style={styles.transitAlertTitle}>🚚 In Transit to Ibadan</Text>
                <Text style={styles.transitAlertText}>
                  Receiver SMS Delivery OTP: <Text style={styles.boldText}>{SECRET_DELIVERY_OTP}</Text>
                </Text>
              </View>
              <Text style={styles.inputLabel}>Enter 4-Digit Delivery OTP (from Receiver):</Text>
              <TextInput
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={4}
                placeholder={`Try: ${SECRET_DELIVERY_OTP}`}
                value={deliveryOtp}
                onChangeText={setDeliveryOtp}
              />
              <TouchableOpacity 
                style={styles.actionButtonGreen}
                onPress={verifyDelivery}
              >
                <Text style={styles.actionButtonText}>Confirm Delivery & Release Escrow</Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === 'DELIVERED' && (
            <View style={styles.deliveredAlert}>
              <Text style={styles.deliveredAlertTitle}>🎉 Delivery Completed!</Text>
              <Text style={styles.deliveredAlertText}>
                Tamper seal confirmed intact. ₦{pricing.carrierBountyNaira.toLocaleString()} released to carrier wallet.
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setStage('MATCHED');
                  setHandoverOtp('');
                  setDeliveryOtp('');
                }}
              >
                <Text style={styles.restartLink}>Restart Simulation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Safety & Compliance Card */}
      <View style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>🛡️ Trust & Safety Protocol</Text>
        <Text style={styles.safetyText}>
          • Biometric NIN/BVN KYC required for all travelers{'\n'}
          • Inspect-before-seal mandatory photo uploads{'\n'}
          • Serialized tamper-evident security tape
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  // Banner: Sky Blue with Gold Border
  banner: { 
    backgroundColor: '#0284c7', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 16, 
    borderWidth: 2, 
    borderColor: '#d4af37',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  bannerBadge: {
    backgroundColor: '#d4af37',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8
  },
  bannerBadgeText: { color: '#0f172a', fontSize: 10, fontWeight: '900' },
  bannerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  bannerSubtitle: { color: '#e0f2fe', fontSize: 13, fontWeight: '600', marginTop: 3 },

  // Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: '#e0f2fe', borderRadius: 14, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#0284c7' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#0369a1' },
  toggleTextActive: { color: '#ffffff' },

  // White Card with Gold Lining
  goldCard: { 
    backgroundColor: '#ffffff', 
    padding: 18, 
    borderRadius: 18, 
    marginBottom: 16, 
    borderWidth: 1.5, 
    borderColor: 'rgba(212, 175, 55, 0.55)',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeader: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  cardDesc: { fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 17 },
  statusPill: { fontSize: 11, fontWeight: '800', color: '#0369a1', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },

  // Route
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  routeIcon: { fontSize: 16, marginRight: 10 },
  routeLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  routeCity: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  routeDivider: { width: 2, height: 16, backgroundColor: '#cbd5e1', marginLeft: 16, marginVertical: 2 },

  // Input & Breakdown
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, fontSize: 15, backgroundColor: '#f8fafc', marginBottom: 14, fontWeight: '700' },
  otpInput: { borderWidth: 2, borderColor: '#0284c7', borderRadius: 12, padding: 12, fontSize: 20, backgroundColor: '#f0f9ff', marginBottom: 14, fontWeight: '900', textAlign: 'center', letterSpacing: 8 },
  feeBreakdown: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  feeLabel: { fontSize: 12, color: '#64748b' },
  feeValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 8 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  totalValue: { fontSize: 16, fontWeight: '900', color: '#0284c7' },

  // Buttons
  actionButtonSky: { backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d4af37' },
  actionButtonGold: { backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonGreen: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  actionButtonTextDark: { color: '#0f172a', fontSize: 14, fontWeight: '900' },

  // Alerts
  fundedAlert: { backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd' },
  fundedAlertTitle: { fontSize: 13, fontWeight: '800', color: '#0369a1', marginBottom: 2 },
  fundedAlertText: { fontSize: 12, color: '#0c4a6e', lineHeight: 16 },
  transitAlert: { backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#38bdf8', marginBottom: 12 },
  transitAlertTitle: { fontSize: 13, fontWeight: '800', color: '#0284c7', marginBottom: 2 },
  transitAlertText: { fontSize: 12, color: '#075985' },
  deliveredAlert: { backgroundColor: '#ecfdf5', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#10b981' },
  deliveredAlertTitle: { fontSize: 14, fontWeight: '900', color: '#065f46', marginBottom: 2 },
  deliveredAlertText: { fontSize: 12, color: '#047857', lineHeight: 16 },
  restartLink: { color: '#0284c7', fontSize: 12, fontWeight: '800', marginTop: 8, textDecorationLine: 'underline' },
  boldText: { fontWeight: '900', color: '#0284c7' },
  errorText: { color: '#dc2626', fontSize: 12, fontWeight: '700', marginBottom: 8 },

  // Safety Card
  safetyCard: { backgroundColor: '#fffdf5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#d4af37', marginBottom: 30 },
  safetyTitle: { fontSize: 13, fontWeight: '800', color: '#75581b', marginBottom: 4 },
  safetyText: { fontSize: 11, color: '#94721d', lineHeight: 16 },
});
