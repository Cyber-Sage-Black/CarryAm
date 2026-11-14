import { 
  Package, 
  Trip, 
  DeliveryAgreement, 
  Profile, 
  PackageCategory, 
  TravelMode, 
  calculateDeliveryPricing 
} from '@carryam/shared';

// ====================================================================
// CARRYAM CORE PERSISTENCE & DATA LAYER
// ====================================================================

export interface EscrowRecord {
  id: string;
  agreementId: string;
  packageId: string;
  senderId: string;
  carrierId: string;
  grossAmountKobo: number;
  carrierNetKobo: number;
  platformFeeKobo: number;
  protectionFeeKobo: number;
  gatewayReference: string;
  status: 'PENDING_DEPOSIT' | 'HELD_IN_ESCROW' | 'RELEASED_TO_CARRIER' | 'REFUNDED';
  fundedAt?: string;
  releasedAt?: string;
}

export interface HandoverRecord {
  id: string;
  agreementId: string;
  packageId: string;
  sealSerialNumber: string;
  handoverOtp: string;
  deliveryOtp: string;
  handoverVerifiedAt?: string;
  deliveryVerifiedAt?: string;
  inspectionPhotos: string[];
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'ESCROW_LOCK';
  amountNaira: number;
  description: string;
  timestamp: string;
  reference: string;
}

export interface UserWallet {
  userId: string;
  availableBalanceNaira: number;
  pendingEscrowNaira: number;
  lifetimeEarningsNaira: number;
  transactions: WalletTransaction[];
}

// Initial Mock Profiles
export const INITIAL_PROFILES: Record<string, Profile> = {
  'usr_tunde': {
    id: 'usr_tunde',
    phoneNumber: '+2348031112222',
    email: 'tunde.carrier@carryam.co',
    firstName: 'Tunde',
    lastName: 'Adeyemi',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    kycTier: 'TIER_2',
    trustScore: 4.95,
    completedDeliveriesCount: 18,
    disputeCount: 0,
    isSuspended: false,
    createdAt: '2026-01-15T08:00:00Z',
  },
  'usr_amina': {
    id: 'usr_amina',
    phoneNumber: '+2348029998888',
    email: 'amina.bello@boutique.ng',
    firstName: 'Amina',
    lastName: 'Bello',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    kycTier: 'TIER_1',
    trustScore: 4.88,
    completedDeliveriesCount: 34,
    disputeCount: 0,
    isSuspended: false,
    createdAt: '2026-02-10T12:00:00Z',
  },
  'usr_adeleke': {
    id: 'usr_adeleke',
    phoneNumber: '+2348055554444',
    email: 'funke.adeleke@yahoo.com',
    firstName: 'Funke',
    lastName: 'Adeleke',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    kycTier: 'TIER_1',
    trustScore: 5.0,
    completedDeliveriesCount: 6,
    disputeCount: 0,
    isSuspended: false,
    createdAt: '2026-03-01T10:00:00Z',
  },
};

// Initial Trips
export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip_lag_ibd_001',
    carrierId: 'usr_tunde',
    originName: 'TotalEnergies Station, Berger, Lagos',
    originCoordinates: { lat: 6.6433, lng: 3.3742 },
    destinationName: 'Iwo Road Interchange, Ibadan',
    destinationCoordinates: { lat: 7.4019, lng: 3.9398 },
    departureTime: 'Today at 2:30 PM',
    estimatedArrivalTime: 'Today at 5:00 PM',
    travelMode: 'PRIVATE_CAR',
    vehicleRegistration: 'Toyota Corolla 2018 (KJA-492-AA)',
    maxCapacityKg: 30.0,
    availableCapacityKg: 24.5,
    pricePerKgKobo: 120000,
    status: 'SCHEDULED',
    carrier: INITIAL_PROFILES['usr_tunde'],
  },
  {
    id: 'trip_lag_ibd_002',
    carrierId: 'usr_tunde',
    originName: 'Mobolaji Johnson Railway Station, Ebute Metta',
    originCoordinates: { lat: 6.4789, lng: 3.3821 },
    destinationName: 'Chief Obafemi Awolowo Train Station, Moniya, Ibadan',
    destinationCoordinates: { lat: 7.5180, lng: 3.9120 },
    departureTime: 'Tomorrow at 8:00 AM',
    estimatedArrivalTime: 'Tomorrow at 10:30 AM',
    travelMode: 'TRAIN',
    vehicleRegistration: 'NRC Standard Gauge Train (Coach 4)',
    maxCapacityKg: 20.0,
    availableCapacityKg: 18.0,
    pricePerKgKobo: 100000,
    status: 'SCHEDULED',
    carrier: INITIAL_PROFILES['usr_tunde'],
  },
];

// Initial Packages
export const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg_skincare_001',
    senderId: 'usr_amina',
    receiverName: 'Mrs. Funke Adeleke',
    receiverPhone: '+2348055554444',
    originName: 'Magodo Phase 2 Main Gate, Lagos',
    originCoordinates: { lat: 6.6180, lng: 3.3850 },
    destinationName: 'Bodija Market Extension, Ibadan',
    destinationCoordinates: { lat: 7.4325, lng: 3.9056 },
    totalWeightKg: 2.5,
    category: 'COSMETICS',
    declaredValueKobo: 2500000, // ₦25,000
    offeredBountyKobo: 300000,  // ₦3,000
    pickupWindowStart: 'Today 12:00 PM',
    pickupWindowEnd: 'Today 2:00 PM',
    status: 'AGREED',
    sender: INITIAL_PROFILES['usr_amina'],
    items: [
      {
        id: 'item_1',
        title: 'Bespoke Organic Glow Skincare Lotions (Pack of 3)',
        quantity: 3,
        itemValueKobo: 2500000,
        isFragile: true,
        isPerishable: false,
        unsealedPhotoUrls: [
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&auto=format&fit=crop&q=80'
        ],
      },
    ],
  },
  {
    id: 'pkg_fashion_002',
    senderId: 'usr_amina',
    receiverName: 'Dr. Kelechi Nwosu',
    receiverPhone: '+2348034441111',
    originName: 'Ikeja City Mall, Alausa, Lagos',
    originCoordinates: { lat: 6.6210, lng: 3.3580 },
    destinationName: 'University of Ibadan (UI) Sub Post Office',
    destinationCoordinates: { lat: 7.4439, lng: 3.9004 },
    totalWeightKg: 1.8,
    category: 'FASHION',
    declaredValueKobo: 1800000, // ₦18,000
    offeredBountyKobo: 250000,  // ₦2,500
    pickupWindowStart: 'Today 1:00 PM',
    pickupWindowEnd: 'Today 3:30 PM',
    status: 'LISTED',
    sender: INITIAL_PROFILES['usr_amina'],
    items: [
      {
        id: 'item_2',
        title: 'Handmade Aso-Oke Traditional Waistcoats (2 pcs)',
        quantity: 2,
        itemValueKobo: 1800000,
        isFragile: false,
        isPerishable: false,
        unsealedPhotoUrls: [
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=300&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&auto=format&fit=crop&q=80'
        ],
      },
    ],
  },
];

// Initial Delivery Agreements
export const INITIAL_AGREEMENTS: DeliveryAgreement[] = [
  {
    id: 'agr_001_skincare',
    packageId: 'pkg_skincare_001',
    tripId: 'trip_lag_ibd_001',
    senderId: 'usr_amina',
    carrierId: 'usr_tunde',
    agreedBountyKobo: 300000,
    platformFeeKobo: 54000,
    protectionFeeKobo: 20400,
    totalSenderChargeKobo: 374400, // ₦3,744.00
    pickupLocationDetail: 'TotalEnergies Service Station, Berger (Opposite Bus Park)',
    dropoffLocationDetail: 'Bodija Market Roundabout (Beside FoodCo Supermarket)',
    senderSignedAt: '2026-11-08T09:15:00Z',
    carrierSignedAt: '2026-11-08T09:30:00Z',
    status: 'ACCEPTED',
    package: INITIAL_PACKAGES[0],
    trip: INITIAL_TRIPS[0],
  },
];

// In-Memory Persistent Store
class CarryAmInfrastructureStore {
  private profiles = { ...INITIAL_PROFILES };
  private trips = [...INITIAL_TRIPS];
  private packages = [...INITIAL_PACKAGES];
  private agreements = [...INITIAL_AGREEMENTS];
  private escrows: Record<string, EscrowRecord> = {};
  private handovers: Record<string, HandoverRecord> = {
    'agr_001_skincare': {
      id: 'hnd_001',
      agreementId: 'agr_001_skincare',
      packageId: 'pkg_skincare_001',
      sealSerialNumber: 'CAM-SEAL-2026-9921',
      handoverOtp: '4819',
      deliveryOtp: '9102',
      inspectionPhotos: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&auto=format&fit=crop&q=80'
      ],
    },
  };
  private wallets: Record<string, UserWallet> = {
    'usr_tunde': {
      userId: 'usr_tunde',
      availableBalanceNaira: 42500,
      pendingEscrowNaira: 0,
      lifetimeEarningsNaira: 168000,
      transactions: [
        {
          id: 'tx_01',
          type: 'CREDIT',
          amountNaira: 4500,
          description: 'Delivery Bounty: Lagos to Ibadan (Electronics)',
          timestamp: '2026-11-05 16:30',
          reference: 'CAM-PAY-882193',
        },
        {
          id: 'tx_02',
          type: 'CREDIT',
          amountNaira: 3200,
          description: 'Delivery Bounty: Berger to UI (Textbooks)',
          timestamp: '2026-11-03 11:20',
          reference: 'CAM-PAY-774019',
        },
      ],
    },
    'usr_amina': {
      userId: 'usr_amina',
      availableBalanceNaira: 12000,
      pendingEscrowNaira: 3744,
      lifetimeEarningsNaira: 0,
      transactions: [],
    },
  };

  // Queries
  getProfiles() { return this.profiles; }
  getProfile(id: string) { return this.profiles[id]; }
  
  getTrips() { return this.trips; }
  getTrip(id: string) { return this.trips.find(t => t.id === id); }

  getPackages() { return this.packages; }
  getPackage(id: string) { return this.packages.find(p => p.id === id); }

  getAgreements() { return this.agreements; }
  getAgreement(id: string) { return this.agreements.find(a => a.id === id); }

  getEscrow(agreementId: string) { return this.escrows[agreementId]; }
  getHandover(agreementId: string) { return this.handovers[agreementId]; }
  getWallet(userId: string) { return this.wallets[userId] || {
    userId,
    availableBalanceNaira: 0,
    pendingEscrowNaira: 0,
    lifetimeEarningsNaira: 0,
    transactions: [],
  }; }

  // Mutations
  createPackage(newPkg: Omit<Package, 'id' | 'status'>): Package {
    const id = `pkg_${Date.now()}`;
    const pkg: Package = {
      ...newPkg,
      id,
      status: 'LISTED',
      sender: this.profiles[newPkg.senderId],
    };
    this.packages.unshift(pkg);
    return pkg;
  }

  createTrip(newTrip: Omit<Trip, 'id' | 'status' | 'availableCapacityKg'>): Trip {
    const id = `trip_${Date.now()}`;
    const trip: Trip = {
      ...newTrip,
      id,
      availableCapacityKg: newTrip.maxCapacityKg,
      status: 'SCHEDULED',
      carrier: this.profiles[newTrip.carrierId],
    };
    this.trips.unshift(trip);
    return trip;
  }

  createAgreement(params: {
    packageId: string;
    tripId: string;
    senderId: string;
    carrierId: string;
    bountyNaira: number;
    pickupLocation: string;
    dropoffLocation: string;
  }): DeliveryAgreement {
    const pkg = this.getPackage(params.packageId);
    const trip = this.getTrip(params.tripId);
    if (!pkg || !trip) throw new Error('Package or Trip not found');

    const bountyKobo = params.bountyNaira * 100;
    const pricing = calculateDeliveryPricing(bountyKobo, pkg.declaredValueKobo);

    const agreementId = `agr_${Date.now()}`;
    const agreement: DeliveryAgreement = {
      id: agreementId,
      packageId: params.packageId,
      tripId: params.tripId,
      senderId: params.senderId,
      carrierId: params.carrierId,
      agreedBountyKobo: bountyKobo,
      platformFeeKobo: pricing.platformFeeKobo,
      protectionFeeKobo: pricing.protectionFeeKobo,
      totalSenderChargeKobo: pricing.totalSenderChargeKobo,
      pickupLocationDetail: params.pickupLocation,
      dropoffLocationDetail: params.dropoffLocation,
      senderSignedAt: new Date().toISOString(),
      carrierSignedAt: new Date().toISOString(),
      status: 'ACCEPTED',
      package: pkg,
      trip: trip,
    };

    pkg.status = 'AGREED';
    this.agreements.unshift(agreement);

    // Setup initial Handover Record with demo OTPs
    this.handovers[agreementId] = {
      id: `hnd_${Date.now()}`,
      agreementId,
      packageId: pkg.id,
      sealSerialNumber: `CAM-SEAL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      handoverOtp: `${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryOtp: `${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionPhotos: pkg.items?.[0]?.unsealedPhotoUrls || [],
    };

    return agreement;
  }

  fundEscrow(agreementId: string, paystackRef: string): EscrowRecord {
    const agreement = this.getAgreement(agreementId);
    if (!agreement) throw new Error('Agreement not found');
    const pkg = this.getPackage(agreement.packageId);
    if (!pkg) throw new Error('Package not found');

    const escrow: EscrowRecord = {
      id: `esc_${Date.now()}`,
      agreementId,
      packageId: agreement.packageId,
      senderId: agreement.senderId,
      carrierId: agreement.carrierId,
      grossAmountKobo: agreement.totalSenderChargeKobo,
      carrierNetKobo: agreement.agreedBountyKobo,
      platformFeeKobo: agreement.platformFeeKobo,
      protectionFeeKobo: agreement.protectionFeeKobo,
      gatewayReference: paystackRef,
      status: 'HELD_IN_ESCROW',
      fundedAt: new Date().toISOString(),
    };

    this.escrows[agreementId] = escrow;
    pkg.status = 'ESCROW_FUNDED';

    // Update wallet pending escrow for carrier
    if (this.wallets[agreement.carrierId]) {
      this.wallets[agreement.carrierId].pendingEscrowNaira += (agreement.agreedBountyKobo / 100);
    }

    return escrow;
  }

  verifyHandover(agreementId: string, inputOtp: string, sealSerial: string): boolean {
    const handover = this.handovers[agreementId];
    const agreement = this.getAgreement(agreementId);
    if (!handover || !agreement) return false;

    if (handover.handoverOtp !== inputOtp.trim()) {
      return false;
    }

    handover.sealSerialNumber = sealSerial;
    handover.handoverVerifiedAt = new Date().toISOString();

    const pkg = this.getPackage(agreement.packageId);
    if (pkg) {
      pkg.status = 'IN_TRANSIT';
    }
    return true;
  }

  verifyDelivery(agreementId: string, inputOtp: string): boolean {
    const handover = this.handovers[agreementId];
    const agreement = this.getAgreement(agreementId);
    const escrow = this.escrows[agreementId];
    if (!handover || !agreement) return false;

    if (handover.deliveryOtp !== inputOtp.trim()) {
      return false;
    }

    handover.deliveryVerifiedAt = new Date().toISOString();

    const pkg = this.getPackage(agreement.packageId);
    if (pkg) {
      pkg.status = 'DELIVERED';
    }

    // Release Escrow Payout to Carrier Wallet
    const netBountyNaira = agreement.agreedBountyKobo / 100;
    if (this.wallets[agreement.carrierId]) {
      const carrierWallet = this.wallets[agreement.carrierId];
      carrierWallet.pendingEscrowNaira = Math.max(0, carrierWallet.pendingEscrowNaira - netBountyNaira);
      carrierWallet.availableBalanceNaira += netBountyNaira;
      carrierWallet.lifetimeEarningsNaira += netBountyNaira;
      carrierWallet.transactions.unshift({
        id: `tx_${Date.now()}`,
        type: 'CREDIT',
        amountNaira: netBountyNaira,
        description: `Escrow Released: Delivery for ${pkg?.receiverName || 'Receiver'} (${pkg?.destinationName || 'Ibadan'})`,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reference: `CAM-RELEASE-${agreementId}`,
      });
    }

    if (escrow) {
      escrow.status = 'RELEASED_TO_CARRIER';
      escrow.releasedAt = new Date().toISOString();
    }

    return true;
  }
}

// Global Singleton
export const carryAmStore = new CarryAmInfrastructureStore();
