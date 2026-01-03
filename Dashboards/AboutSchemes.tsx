import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, IndianRupee, Shield, Sprout, Users, Building2, Tractor, Droplets, FileText, Filter, X, AlertCircle, Loader, Verified } from 'lucide-react';
import { validateAcreage } from '../services/inputValidationService';
import { verifyGoSugamRegistration, verifyValueChainCluster, verifyFPOMembership, VerificationResult } from '../services/verificationService';
import { getUserById } from '../services/authService';

interface AboutSchemesProps {
  lang: string;
  onBack: () => void;
  userId?: string;
  location?: string;
}

interface FarmerProfile {
  farmerType: string; // 'small', 'marginal', 'large', 'landless', 'sharecropper'
  landSize: number; // in acres
  isFPOMember: boolean;
  isInCluster: boolean;
  hasRiceFallow: boolean;
  isRegistered: boolean;
  category: string; // 'general', 'sc', 'st'
  gender: 'male' | 'female' | ''; // 'male', 'female'
  district: string;
  hasBankLoan: boolean;
}

interface Scheme {
  name: string;
  icon: React.ReactNode;
  basicDetails: string;
  benefits: string[];
  useCase: string;
  eligibility: string;
  checkEligibility: (profile: FarmerProfile) => { eligible: boolean; reason?: string };
}

const AboutSchemes: React.FC<AboutSchemesProps> = ({ lang, onBack, userId, location = '' }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'eligible'>('all');
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile>({
    farmerType: '',
    landSize: 0,
    isFPOMember: false,
    isInCluster: false,
    hasRiceFallow: false,
    isRegistered: false,
    category: 'general',
    gender: '',
    district: '',
    hasBankLoan: false,
  });
  const [verifyingGoSugam, setVerifyingGoSugam] = useState(false);
  const [verifyingCluster, setVerifyingCluster] = useState(false);
  const [verifyingFPO, setVerifyingFPO] = useState(false);
  const [goSugamVerification, setGoSugamVerification] = useState<VerificationResult | null>(null);
  const [clusterVerification, setClusterVerification] = useState<VerificationResult | null>(null);
  const [fpoVerification, setFpoVerification] = useState<VerificationResult | null>(null);
  const [landSizeError, setLandSizeError] = useState('');

  // Get farmer name from userId
  const user = userId ? getUserById(userId) : null;
  const farmerName = user?.name || '';

  // Verification handlers
  const handleVerifyGoSugam = async () => {
    if (!farmerName || !location) {
      alert(lang === 'en' 
        ? 'Please ensure your name and location are set to verify Go-Sugam registration.'
        : 'Go-Sugam ପଞ୍ଜୀକରଣ ଯାଞ୍ଚ କରିବା ପାଇଁ ଦୟାକରି ଆପଣଙ୍କର ନାମ ଏବଂ ସ୍ଥାନ ସେଟ୍ କରନ୍ତୁ |');
      return;
    }
    setVerifyingGoSugam(true);
    try {
      const result = await verifyGoSugamRegistration(farmerName, location);
      setGoSugamVerification(result);
      if (result.verified) {
        setFarmerProfile(prev => ({ ...prev, isRegistered: true }));
      }
    } catch (error) {
      console.error('Verification error:', error);
      setGoSugamVerification({
        verified: false,
        message: lang === 'en' ? 'Verification failed. Please try again.' : 'ଯାଞ୍ଚ ବିଫଳ ହେଲା | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |',
      });
    } finally {
      setVerifyingGoSugam(false);
    }
  };

  const handleVerifyCluster = async () => {
    if (!farmerName || !location) {
      alert(lang === 'en'
        ? 'Please ensure your name and location are set to verify cluster membership.'
        : 'କ୍ଲଷ୍ଟର ସଦସ୍ୟତା ଯାଞ୍ଚ କରିବା ପାଇଁ ଦୟାକରି ଆପଣଙ୍କର ନାମ ଏବଂ ସ୍ଥାନ ସେଟ୍ କରନ୍ତୁ |');
      return;
    }
    setVerifyingCluster(true);
    try {
      const result = await verifyValueChainCluster(farmerName, location);
      setClusterVerification(result);
      if (result.verified) {
        setFarmerProfile(prev => ({ ...prev, isInCluster: true }));
      }
    } catch (error) {
      console.error('Verification error:', error);
      setClusterVerification({
        verified: false,
        message: lang === 'en' ? 'Verification failed. Please try again.' : 'ଯାଞ୍ଚ ବିଫଳ ହେଲା | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |',
      });
    } finally {
      setVerifyingCluster(false);
    }
  };

  const handleVerifyFPO = async () => {
    if (!farmerName || !location) {
      alert(lang === 'en'
        ? 'Please ensure your name and location are set to verify FPO membership.'
        : 'FPO ସଦସ୍ୟତା ଯାଞ୍ଚ କରିବା ପାଇଁ ଦୟାକରି ଆପଣଙ୍କର ନାମ ଏବଂ ସ୍ଥାନ ସେଟ୍ କରନ୍ତୁ |');
      return;
    }
    setVerifyingFPO(true);
    try {
      const result = await verifyFPOMembership(farmerName, location);
      setFpoVerification(result);
      if (result.verified) {
        setFarmerProfile(prev => ({ ...prev, isFPOMember: true }));
      }
    } catch (error) {
      console.error('Verification error:', error);
      setFpoVerification({
        verified: false,
        message: lang === 'en' ? 'Verification failed. Please try again.' : 'ଯାଞ୍ଚ ବିଫଳ ହେଲା | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |',
      });
    } finally {
      setVerifyingFPO(false);
    }
  };

  // Get max land size based on farmer type
  const getMaxLandSize = (farmerType: string): number => {
    switch (farmerType) {
      case 'marginal':
        return 1.0; // Marginal: < 1 acre
      case 'small':
        return 2.5; // Small: < 2.5 acres
      case 'large':
        return 1000; // Large: > 2.5 acres (no practical upper limit, but set reasonable max)
      case 'sharecropper':
        return 1000; // Sharecropper: can have varying land sizes
      case 'landless':
        return 0; // Landless: should be 0
      default:
        return 1000; // Default: no limit
    }
  };

  // Get min land size based on farmer type
  const getMinLandSize = (farmerType: string): number => {
    if (farmerType === 'landless') {
      return 0;
    }
    if (farmerType === 'large') {
      return 2.5; // Large: > 2.5 acres
    }
    return 0; // Others can start from 0
  };

  // Validate and adjust land size when farmer type changes
  useEffect(() => {
    if (farmerProfile.farmerType && farmerProfile.landSize > 0) {
      const maxSize = getMaxLandSize(farmerProfile.farmerType);
      const minSize = getMinLandSize(farmerProfile.farmerType);
      
      if (farmerProfile.landSize > maxSize) {
        setLandSizeError(
          lang === 'en' 
            ? `${farmerProfile.farmerType === 'marginal' ? 'Marginal' : farmerProfile.farmerType === 'small' ? 'Small' : 'Large'} farmers can have maximum ${maxSize} ${maxSize === 1 ? 'acre' : 'acres'}`
            : `${farmerProfile.farmerType === 'marginal' ? 'ସୀମାନ୍ତ' : farmerProfile.farmerType === 'small' ? 'ଛୋଟ' : 'ବଡ଼'} କୃଷକମାନଙ୍କର ସର୍ବାଧିକ ${maxSize} ${maxSize === 1 ? 'ଏକର' : 'ଏକର'} ହୋଇପାରେ`
        );
        setFarmerProfile({ ...farmerProfile, landSize: maxSize });
      } else if (farmerProfile.landSize < minSize && farmerProfile.farmerType === 'large') {
        setLandSizeError(
          lang === 'en'
            ? 'Large farmers must have more than 2.5 acres'
            : 'ବଡ଼ କୃଷକମାନଙ୍କର ୨.୫ ଏକରରୁ ଅଧିକ ଜମି ରହିବା ଆବଶ୍ୟକ'
        );
      } else {
        setLandSizeError('');
      }
    } else if (farmerProfile.farmerType === 'landless' && farmerProfile.landSize > 0) {
      setLandSizeError(
        lang === 'en'
          ? 'Landless farmers should have 0 acres'
          : 'ଭୂମିହୀନ କୃଷକମାନଙ୍କର ୦ ଏକର ଜମି ରହିବା ଆବଶ୍ୟକ'
      );
      setFarmerProfile({ ...farmerProfile, landSize: 0 });
    } else {
      setLandSizeError('');
    }
  }, [farmerProfile.farmerType, lang]);

  const schemes: Scheme[] = [
    {
      name: 'National Mission on Edible Oils - Oilseeds (NMEO-Oilseeds)',
      icon: <Sprout size={24} className="text-enam-green" />,
      basicDetails: lang === 'en' 
        ? 'Newly approved for 2024-25 to 2030-31. This mission focuses on increasing the production of key oilseeds like Rapeseed-Mustard, Groundnut, Soybean, Sunflower, and Sesamum. It operates through "Value Chain Clusters" managed by FPOs or Cooperatives.'
        : '୨୦୨୪-୨୫ରୁ ୨୦୩୦-୩୧ ପାଇଁ ନୂଆ ଭାବରେ ଅନୁମୋଦିତ | ଏହି ମିଶନ୍ ରାପସିଡ୍-ସରସୋ, ଚିନାବାଦାମ, ସୋୟାବିନ୍, ସୂର୍ଯ୍ୟମୁଖୀ, ଏବଂ ତିଳ ଭଳି ମୁଖ୍ୟ ତେଲବିହନ ଉତ୍ପାଦନ ବୃଦ୍ଧି ଉପରେ ଧ୍ୟାନ ଦେଇଥାଏ |',
      benefits: lang === 'en' 
        ? [
            'Free Quality Seeds: Access to high-yielding and climate-resilient seed varieties at no cost.',
            'Guaranteed Market: Direct linkage with value chain partners (processors) ensures you have a buyer for your produce.',
            'Training: Free training on Good Agricultural Practices (GAP) and weather/pest management.',
            'Soil Health Support: Mandatory soil testing and fertilizer recommendations.'
          ]
        : [
            'ମାଗଣା ଗୁଣବତ୍ତା ବିହନ: ଉଚ୍ଚ ଉତ୍ପାଦନ ଏବଂ ଜଳବାୟୁ-ସ୍ଥାୟୀ ବିହନ ପ୍ରଜାତିରେ ମାଗଣା ପ୍ରବେଶ |',
            'ନିଶ୍ଚିତ ବଜାର: ମୂଲ୍ୟ ଶୃଙ୍ଖଳା ସହଭାଗୀମାନଙ୍କ ସହିତ ସିଧାସଳଖ ସଂଯୋଗ ଆପଣଙ୍କ ଉତ୍ପାଦନର କ୍ରେତା ନିଶ୍ଚିତ କରେ |',
            'ପ୍ରଶିକ୍ଷଣ: ଉତ୍କୃଷ୍ଟ କୃଷି ଅଭ୍ୟାସ (GAP) ଏବଂ ଜଳବାୟୁ/କୀଟପତଙ୍ଗ ପରିଚାଳନା ଉପରେ ମାଗଣା ପ୍ରଶିକ୍ଷଣ |',
            'ମାଟି ସ୍ୱାସ୍ଥ୍ୟ ସହାୟତା: ବାଧ୍ୟତାମୂଳକ ମାଟି ପରୀକ୍ଷଣ ଏବଂ ସାର ପରାମର୍ଶ |'
          ],
      useCase: lang === 'en'
        ? 'Best for farmers in designated "Oilseed Clusters" who want to switch from low-yield crops to high-value oilseeds or utilize rice-fallow lands.'
        : 'ନିର୍ଦ୍ଧାରିତ "ତେଲବିହନ କ୍ଲଷ୍ଟର"ରେ ଥିବା କୃଷକମାନଙ୍କ ପାଇଁ ଉତ୍କୃଷ୍ଟ ଯେଉଁମାନେ ନିମ୍ନ-ଉତ୍ପାଦନ ଫସଲରୁ ଉଚ୍ଚ-ମୂଲ୍ୟ ତେଲବିହନକୁ ସ୍ଥାନାନ୍ତର କରିବାକୁ ଚାହାନ୍ତି କିମ୍ବା ଧାନ-ପର୍ତ୍ତି ଜମି ବ୍ୟବହାର କରିବାକୁ ଚାହାନ୍ତି |',
      eligibility: lang === 'en'
        ? 'Must be a registered farmer within a Value Chain Cluster. Must be a member of the FPO, Cooperative, or group managing that cluster (typically requires ~200 farmers per cluster).'
        : 'ଏକ ମୂଲ୍ୟ ଶୃଙ୍ଖଳା କ୍ଲଷ୍ଟର ମଧ୍ୟରେ ଏକ ପଞ୍ଜୀକୃତ କୃଷକ ହେବା ଆବଶ୍ୟକ | ଏହି କ୍ଲଷ୍ଟର ପରିଚାଳନା କରୁଥିବା FPO, ସହକାରିତା, କିମ୍ବା ଗୋଷ୍ଠୀର ସଦସ୍ୟ ହେବା ଆବଶ୍ୟକ |',
      checkEligibility: (profile) => {
        if (!profile.isRegistered) {
          return { eligible: false, reason: lang === 'en' ? 'Must be a registered farmer' : 'ଏକ ପଞ୍ଜୀକୃତ କୃଷକ ହେବା ଆବଶ୍ୟକ' };
        }
        if (!profile.isInCluster) {
          return { eligible: false, reason: lang === 'en' ? 'Must be in a Value Chain Cluster' : 'ଏକ ମୂଲ୍ୟ ଶୃଙ୍ଖଳା କ୍ଲଷ୍ଟରରେ ଥିବା ଆବଶ୍ୟକ' };
        }
        if (!profile.isFPOMember) {
          return { eligible: false, reason: lang === 'en' ? 'Must be a member of FPO/Cooperative' : 'FPO/ସହକାରିତାର ସଦସ୍ୟ ହେବା ଆବଶ୍ୟକ' };
        }
        return { eligible: true };
      }
    },
    {
      name: 'KALIA (Krushak Assistance for Livelihood and Income Augmentation)',
      icon: <IndianRupee size={24} className="text-govt-orange" />,
      basicDetails: lang === 'en'
        ? "Odisha's flagship direct benefit transfer scheme."
        : 'ଓଡ଼ିଶାର ପ୍ରମୁଖ ସିଧାସଳଖ ଲାଭ ଅନ୍ତରାଳ ଯୋଜନା |',
      benefits: lang === 'en'
        ? [
            'Financial Support: Small & Marginal farmers get ₹10,000/year (Converged with PM-KISAN; typically ₹6,000 from Centre + ₹4,000 from State).',
            'Interest-Free Loan: Crop loans up to ₹50,000 at 0% interest.',
            'Life Insurance: ₹2 Lakh life insurance and ₹2 Lakh accident cover at nominal/free premiums.'
          ]
        : [
            'ଆର୍ଥିକ ସହାୟତା: ଛୋଟ ଏବଂ ସୀମାନ୍ତ କୃଷକମାନେ ବାର୍ଷିକ ₹୧୦,୦୦୦ ପାଆନ୍ତି (PM-KISAN ସହିତ ସମ୍ମିଳିତ; ସାଧାରଣତଃ କେନ୍ଦ୍ରରୁ ₹୬,୦୦୦ + ରାଜ୍ୟରୁ ₹୪,୦୦୦) |',
            'ସୁଦ-ମୁକ୍ତ ଋଣ: ୦% ସୁଦରେ ₹୫୦,୦୦୦ ପର୍ଯ୍ୟନ୍ତ ଫସଲ ଋଣ |',
            'ଜୀବନ ବୀମା: ନାମମାତ୍ର/ମାଗଣା ପ୍ରିମିୟମରେ ₹୨ ଲକ୍ଷ ଜୀବନ ବୀମା ଏବଂ ₹୨ ଲକ୍ଷ ଦୁର୍ଘଟଣା ଆବରଣ |'
          ],
      useCase: lang === 'en'
        ? 'The interest-free loan is excellent for purchasing higher-cost inputs required for oil palm or hybrid oilseeds without falling into debt.'
        : 'ତେଲ ପାମ୍ କିମ୍ବା ସଂକରଣ ତେଲବିହନ ପାଇଁ ଆବଶ୍ୟକ ଉଚ୍ଚ-ମୂଲ୍ୟ ଇନପୁଟ୍ କ୍ରୟ କରିବା ପାଇଁ ସୁଦ-ମୁକ୍ତ ଋଣ ଉତ୍କୃଷ୍ଟ, ଋଣରେ ପଡିବା ବିନା |',
      eligibility: lang === 'en'
        ? 'Small/Marginal farmers, sharecroppers, and landless agricultural households.'
        : 'ଛୋଟ/ସୀମାନ୍ତ କୃଷକ, ବଟାଇଦାର, ଏବଂ ଭୂମିହୀନ କୃଷି ପରିବାର |',
      checkEligibility: (profile) => {
        const eligibleTypes = ['small', 'marginal', 'sharecropper', 'landless'];
        if (!eligibleTypes.includes(profile.farmerType)) {
          return { eligible: false, reason: lang === 'en' ? 'Only for Small/Marginal farmers, sharecroppers, or landless households' : 'କେବଳ ଛୋଟ/ସୀମାନ୍ତ କୃଷକ, ବଟାଇଦାର, କିମ୍ବା ଭୂମିହୀନ ପରିବାର ପାଇଁ' };
        }
        return { eligible: true };
      }
    },
    {
      name: 'Mukhyamantri Krushi Udyog Yojana (MKUY)',
      icon: <Building2 size={24} className="text-indigo-600" />,
      basicDetails: lang === 'en'
        ? 'Promotes setting up "Agri-Enterprises" and commercial farming units.'
        : '"କୃଷି-ଉଦ୍ୟୋଗ" ଏବଂ ବାଣିଜ୍ୟିକ କୃଷି ଏକକ ସ୍ଥାପନକୁ ଉତ୍ସାହିତ କରେ |',
      benefits: lang === 'en'
        ? [
            'Capital Investment Subsidy (CIS): Subsidy of 40-50% on the fixed capital cost (excluding land).',
            'Limit: Maximum subsidy up to ₹50 Lakh (up to ₹1 Crore for women/SC/ST/FPOs).'
          ]
        : [
            'ମୂଳଧନ ବିନିଯୋଗ ସବସିଡି (CIS): ସ୍ଥିର ମୂଳଧନ ମୂଲ୍ୟରେ ୪୦-୫୦% ସବସିଡି (ଜମି ବ୍ୟତୀତ) |',
            'ସୀମା: ସର୍ବାଧିକ ₹୫୦ ଲକ୍ଷ ସବସିଡି (ମହିଳା/SC/ST/FPOs ପାଇଁ ₹୧ କୋଟି ପର୍ଯ୍ୟନ୍ତ) |'
          ],
      useCase: lang === 'en'
        ? 'If you or a group of farmers want to set up a Mini Oil Mill, Groundnut Decorticator unit, or a seed processing plant.'
        : 'ଯଦି ଆପଣ କିମ୍ବା କୃଷକମାନଙ୍କର ଏକ ଗୋଷ୍ଠୀ ଏକ ମିନି ତେଲ ମିଲ୍, ଚିନାବାଦାମ ଡିକୋର୍ଟିକେଟର୍ ଏକକ, କିମ୍ବା ଏକ ବିହନ ପ୍ରକ୍ରିୟାକରଣ ପ୍ଲାଣ୍ଟ ସ୍ଥାପନ କରିବାକୁ ଚାହାନ୍ତି |',
      eligibility: lang === 'en'
        ? 'Individual farmers, SHGs, FPOs. Must have land and ability to invest the remaining portion (bank loan).'
        : 'ବ୍ୟକ୍ତିଗତ କୃଷକ, SHGs, FPOs | ଜମି ଏବଂ ଅବଶିଷ୍ଟ ଅଂଶରେ ବିନିଯୋଗ କରିବାର ସାମର୍ଥ୍ୟ (ବ୍ୟାଙ୍କ ଋଣ) ରହିବା ଆବଶ୍ୟକ |',
      checkEligibility: (profile) => {
        if (profile.landSize === 0 && !profile.isFPOMember) {
          return { eligible: false, reason: lang === 'en' ? 'Must have land or be an FPO member' : 'ଜମି ରହିବା କିମ୍ବା FPO ସଦସ୍ୟ ହେବା ଆବଶ୍ୟକ' };
        }
        if (!profile.hasBankLoan && profile.landSize < 0.5) {
          return { eligible: false, reason: lang === 'en' ? 'Need ability to invest remaining portion (bank loan or sufficient land)' : 'ଅବଶିଷ୍ଟ ଅଂଶରେ ବିନିଯୋଗ କରିବାର ସାମର୍ଥ୍ୟ ଆବଶ୍ୟକ (ବ୍ୟାଙ୍କ ଋଣ କିମ୍ବା ଯଥେଷ୍ଟ ଜମି)' };
        }
        return { eligible: true };
      }
    },
    {
      name: 'Odisha Farm Mechanization (DBT)',
      icon: <Tractor size={24} className="text-blue-600" />,
      basicDetails: lang === 'en'
        ? 'Subsidies on purchasing farm machinery through the "Agrisnet" or "Odisha Farm Machinery" portal.'
        : '"Agrisnet" କିମ୍ବା "Odisha Farm Machinery" ପୋର୍ଟାଲ୍ ମାଧ୍ୟମରେ କୃଷି ଯନ୍ତ୍ରପାତି କ୍ରୟରେ ସବସିଡି |',
      benefits: lang === 'en'
        ? ['Huge subsidies (often 50-75%) on implements like Rotavators, Seed Drills, and Multi-crop Threshers.']
        : ['ରୋଟାଭେଟର୍, ବିହନ ଡ୍ରିଲ୍, ଏବଂ ବହୁ-ଫସଲ ଥ୍ରେସର୍ ଭଳି ଉପକରଣରେ ବିଶାଳ ସବସିଡି (ପ୍ରାୟତଃ ୫୦-୭୫%) |'],
      useCase: lang === 'en'
        ? 'Oilseeds require fine seedbeds. Using a subsidized rotavator or seed drill ensures better germination and lower labor costs.'
        : 'ତେଲବିହନରେ ସୁକ୍ଷ୍ମ ବିହନଶଯ୍ୟା ଆବଶ୍ୟକ | ସବସିଡିଯୁକ୍ତ ରୋଟାଭେଟର୍ କିମ୍ବା ବିହନ ଡ୍ରିଲ୍ ବ୍ୟବହାର କରିବା ଉତ୍କୃଷ୍ଟ ଅଙ୍କୁରଣ ଏବଂ ନିମ୍ନ ଶ୍ରମ ମୂଲ୍ୟ ସୁନିଶ୍ଚିତ କରେ |',
      eligibility: lang === 'en'
        ? 'Any farmer registered on the Go-Sugam or Agrisnet portal.'
        : 'Go-Sugam କିମ୍ବା Agrisnet ପୋର୍ଟାଲରେ ପଞ୍ଜୀକୃତ ଯେକୌଣସି କୃଷକ |',
      checkEligibility: (profile) => {
        if (!profile.isRegistered) {
          return { eligible: false, reason: lang === 'en' ? 'Must be registered on Go-Sugam or Agrisnet portal' : 'Go-Sugam କିମ୍ବା Agrisnet ପୋର୍ଟାଲରେ ପଞ୍ଜୀକୃତ ହେବା ଆବଶ୍ୟକ' };
        }
        return { eligible: true };
      }
    },
    {
      name: 'Rice Fallow Management (Targeting Rice Fallow Areas - TRFA)',
      icon: <Droplets size={24} className="text-cyan-600" />,
      basicDetails: lang === 'en'
        ? 'A specific intervention to grow pulses and oilseeds (Mustard/Sesame) in land left fallow after rice harvest.'
        : 'ଧାନ ଅମଳ ପରେ ଛାଡ଼ିଦିଆଯାଇଥିବା ଜମିରେ ଡାଲି ଏବଂ ତେଲବିହନ (ସରସୋ/ତିଳ) ଚାଷ କରିବା ପାଇଁ ଏକ ନିର୍ଦ୍ଦିଷ୍ଟ ହସ୍ତକ୍ଷେପ |',
      benefits: lang === 'en'
        ? ['Distribution of free/subsidized seeds (minikits) and demonstration of technology.']
        : ['ମାଗଣା/ସବସିଡିଯୁକ୍ତ ବିହନ (ମିନିକିଟ୍) ବିତରଣ ଏବଂ ପ୍ରଯୁକ୍ତିର ପ୍ରଦର୍ଶନ |'],
      useCase: lang === 'en'
        ? 'Perfect for farmers in coastal/irrigated Odisha who usually leave land empty after Kharif paddy.'
        : 'ଉପକୂଳ/ସଞ୍ଚିତ ଓଡ଼ିଶାରେ ଥିବା କୃଷକମାନଙ୍କ ପାଇଁ ଉତ୍କୃଷ୍ଟ ଯେଉଁମାନେ ସାଧାରଣତଃ ଖରିଫ୍ ଧାନ ପରେ ଜମି ଖାଲି ଛାଡନ୍ତି |',
      eligibility: lang === 'en'
        ? 'Farmers in identified districts with rice-fallow potential.'
        : 'ଧାନ-ପର୍ତ୍ତି ସମ୍ଭାବନା ସହିତ ଚିହ୍ନିତ ଜିଲ୍ଲାରେ କୃଷକମାନେ |',
      checkEligibility: (profile) => {
        if (!profile.hasRiceFallow) {
          return { eligible: false, reason: lang === 'en' ? 'Must have rice-fallow land after Kharif harvest' : 'ଖରିଫ୍ ଅମଳ ପରେ ଧାନ-ପର୍ତ୍ତି ଜମି ରହିବା ଆବଶ୍ୟକ' };
        }
        return { eligible: true };
      }
    },
    {
      name: 'PM-KISAN',
      icon: <IndianRupee size={24} className="text-green-600" />,
      basicDetails: lang === 'en'
        ? 'Provides a direct cash transfer of ₹6,000 per year to farmers, distributed in three equal installments. The goal is to provide income support for agricultural input costs.'
        : 'କୃଷକମାନଙ୍କୁ ବାର୍ଷିକ ₹୬,୦୦୦ର ସିଧାସଳଖ ନଗଦ ଅନ୍ତରାଳ, ତିନି ସମାନ କିସ୍ତରେ ବିତରଣ | ଲକ୍ଷ୍ୟ ହେଉଛି କୃଷି ଇନପୁଟ୍ ମୂଲ୍ୟରେ ଆୟ ସହାୟତା ପ୍ରଦାନ କରିବା |',
      benefits: [],
      useCase: lang === 'en'
        ? 'You can use this cash specifically to purchase fertilizers or pay for labor during the critical sowing season for oilseeds.'
        : 'ତେଲବିହନର ମୁଖ୍ୟ ବିହନ ଋତୁରେ ସାର କ୍ରୟ କରିବା କିମ୍ବା ଶ୍ରମ ପ୍ରଦାନ କରିବା ପାଇଁ ଆପଣ ଏହି ନଗଦକୁ ନିର୍ଦ୍ଦିଷ୍ଟ ଭାବରେ ବ୍ୟବହାର କରିପାରିବେ |',
      eligibility: lang === 'en'
        ? 'All landholding farmer families (defined as husband, wife, and minor children) who possess cultivable land.'
        : 'ଚାଷଯୋଗ୍ୟ ଜମିର ମାଲିକାନା ଥିବା ସମସ୍ତ କୃଷକ ପରିବାର (ପତି, ପତ୍ନୀ, ଏବଂ ନାବାଳିଗ ପିଲାମାନେ ବ୍ୟାଖ୍ୟା କରାଯାଇଥାଏ) |',
      checkEligibility: (profile) => {
        if (profile.landSize === 0 && profile.farmerType !== 'landless') {
          return { eligible: false, reason: lang === 'en' ? 'Must possess cultivable land' : 'ଚାଷଯୋଗ୍ୟ ଜମିର ମାଲିକାନା ଥିବା ଆବଶ୍ୟକ' };
        }
        return { eligible: true };
      }
    },
    {
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      icon: <Shield size={24} className="text-blue-500" />,
      basicDetails: lang === 'en'
        ? 'Offers crop insurance coverage against natural calamities such as drought, floods, and pests. Farmers pay a very low premium: 1.5% for Rabi crops and 2% for Kharif crops of the sum insured.'
        : 'ମରୁଡି, ବନ୍ୟା, ଏବଂ କୀଟପତଙ୍ଗ ଭଳି ପ୍ରାକୃତିକ ଦୁର୍ଘଟଣା ବିରୁଦ୍ଧରେ ଫସଲ ବୀମା ଆବରଣ ପ୍ରଦାନ କରେ | କୃଷକମାନେ ଅତ୍ୟନ୍ତ ନିମ୍ନ ପ୍ରିମିୟମ ଦିଅନ୍ତି: ରବି ଫସଲ ପାଇଁ ୧.୫% ଏବଂ ଖରିଫ୍ ଫସଲ ପାଇଁ ୨% ବୀମା ପରିମାଣର |',
      benefits: [],
      useCase: lang === 'en'
        ? 'This is critical for oilseed crops like Groundnut and Mustard, which are highly sensitive to weather fluctuations and pest attacks.'
        : 'ଚିନାବାଦାମ ଏବଂ ସରସୋ ଭଳି ତେଲବିହନ ଫସଲ ପାଇଁ ଏହା ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ, ଯାହା ଜଳବାୟୁ ପରିବର୍ତ୍ତନ ଏବଂ କୀଟପତଙ୍ଗ ଆକ୍ରମଣ ପ୍ରତି ଅତ୍ୟଧିକ ସମ୍ବେଦନଶୀଳ |',
      eligibility: lang === 'en'
        ? 'Open to all farmers. Loanee farmers (those with KCC loans) are automatically enrolled, while non-loanee farmers can voluntarily opt-in.'
        : 'ସମସ୍ତ କୃଷକମାନଙ୍କ ପାଇଁ ଖୋଲା | ଋଣୀ କୃଷକମାନେ (KCC ଋଣ ଥିବା) ସ୍ୱୟଂଚାଳିତ ଭାବରେ ନାମଲେଖା କରନ୍ତି, ଯେତେବେଳେ ଅଣ-ଋଣୀ କୃଷକମାନେ ସ୍ୱେଚ୍ଛାକୃତ ଭାବରେ ବାଛିପାରନ୍ତି |',
      checkEligibility: () => {
        return { eligible: true }; // Open to all
      }
    },
    {
      name: 'Soil Health Card Scheme',
      icon: <FileText size={24} className="text-brown-600" />,
      basicDetails: lang === 'en'
        ? 'Provides a detailed "report card" on the nutrient status of your farm\'s soil. The goal is to reduce fertilizer costs by recommending exactly which nutrients are needed, rather than generic application.'
        : 'ଆପଣଙ୍କ ଚାଷଜମିର ମାଟିର ପୋଷକ ସ୍ଥିତିରେ ଏକ ବିସ୍ତୃତ "ରିପୋର୍ଟ କାର୍ଡ" ପ୍ରଦାନ କରେ | ଲକ୍ଷ୍ୟ ହେଉଛି ସାଧାରଣ ପ୍ରୟୋଗ ପରିବର୍ତ୍ତେ ନିର୍ଦ୍ଦିଷ୍ଟ ଭାବରେ କେଉଁ ପୋଷକ ଆବଶ୍ୟକ ତାହା ସୁପାରିଶ କରି ସାର ମୂଲ୍ୟ ହ୍ରାସ କରିବା |',
      benefits: [],
      useCase: lang === 'en'
        ? 'This is often mandatory for farmers in NMEO clusters to ensure money is not wasted on unnecessary Urea or DAP, optimizing the specific nutrition oilseeds need.'
        : 'NMEO କ୍ଲଷ୍ଟରରେ ଥିବା କୃଷକମାନଙ୍କ ପାଇଁ ଏହା ପ୍ରାୟତଃ ବାଧ୍ୟତାମୂଳକ ଯାହା ଦ୍ୱାରା ଅନାବଶ୍ୟକ ୟୁରିଆ କିମ୍ବା DAPରେ ଟଙ୍କା ନଷ୍ଟ ନହେବା ସୁନିଶ୍ଚିତ ହୁଏ, ତେଲବିହନର ଆବଶ୍ୟକ ନିର୍ଦ୍ଦିଷ୍ଟ ପୋଷଣକୁ ଅନୁକୂଳ କରେ |',
      eligibility: lang === 'en'
        ? 'Available to all farmers. Soil samples are typically collected by the state agriculture department.'
        : 'ସମସ୍ତ କୃଷକମାନଙ୍କ ପାଇଁ ଉପଲବ୍ଧ | ମାଟି ନମୁନା ସାଧାରଣତଃ ରାଜ୍ୟ କୃଷି ବିଭାଗ ଦ୍ୱାରା ସଂଗ୍ରହ କରାଯାଏ |',
      checkEligibility: () => {
        return { eligible: true }; // Available to all
      }
    },
    {
      name: 'Agriculture Infrastructure Fund (AIF)',
      icon: <Building2 size={24} className="text-purple-600" />,
      basicDetails: lang === 'en'
        ? 'Provides an interest subvention of 3% on loans up to ₹2 Crore. The goal is to fund the creation of post-harvest management infrastructure.'
        : '₹୨ କୋଟି ପର୍ଯ୍ୟନ୍ତ ଋଣରେ ୩% ସୁଦ ସବସିଡି ପ୍ରଦାନ କରେ | ଲକ୍ଷ୍ୟ ହେଉଛି ଅମଳ-ପର ପରିଚାଳନା ମୌଳିକ ସୁବିଧା ସୃଷ୍ଟିରେ ଅର୍ଥ ସଂଗ୍ରହ |',
      benefits: [],
      useCase: lang === 'en'
        ? 'This can be used to build a small on-farm oil extraction unit or a storage shed (godown) to hold your oilseeds until market prices rise.'
        : 'ଏହା ଏକ ଛୋଟ ଫାର୍ମ-ଉପରେ ତେଲ ନିଷ୍କାସନ ଏକକ କିମ୍ବା ଏକ ଗଚ୍ଛିତ ଶେଡ୍ (ଗୋଦାମ) ନିର୍ମାଣ କରିବା ପାଇଁ ବ୍ୟବହାର କରାଯାଇପାରେ ଯାହା ବଜାର ମୂଲ୍ୟ ବୃଦ୍ଧି ପର୍ଯ୍ୟନ୍ତ ଆପଣଙ୍କ ତେଲବିହନକୁ ଧରି ରଖିବ |',
      eligibility: lang === 'en'
        ? 'Farmers, Farmer Producer Organizations (FPOs), Primary Agricultural Credit Societies (PACS), and Agri-entrepreneurs.'
        : 'କୃଷକ, କୃଷକ ଉତ୍ପାଦକ ସଂଗଠନ (FPOs), ପ୍ରାଥମିକ କୃଷି ଋଣ ସମିତି (PACS), ଏବଂ କୃଷି-ଉଦ୍ୟୋଗୀ |',
      checkEligibility: (profile) => {
        if (profile.landSize === 0 && !profile.isFPOMember) {
          return { eligible: false, reason: lang === 'en' ? 'Must be a farmer, FPO, PACS, or Agri-entrepreneur' : 'କୃଷକ, FPO, PACS, କିମ୍ବା କୃଷି-ଉଦ୍ୟୋଗୀ ହେବା ଆବଶ୍ୟକ' };
        }
        return { eligible: true };
      }
    }
  ];

  const checkSchemeEligibility = (scheme: Scheme) => {
    return scheme.checkEligibility(farmerProfile);
  };

  const eligibleSchemes = schemes.filter(scheme => checkSchemeEligibility(scheme).eligible);
  const displayedSchemes = filterMode === 'eligible' ? eligibleSchemes : schemes;

  // Generate scheme combinations that can be availed together
  const generateSchemeCombinations = () => {
    const combinations: Array<{ schemes: Scheme[]; totalBenefits: string; description: string }> = [];
    
    // Get all eligible schemes
    const eligible = schemes.filter(s => checkSchemeEligibility(s).eligible);
    
    // Generate combinations of 2, 3, and 4 schemes
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const combo2 = [eligible[i], eligible[j]];
        const benefits = getCombinationBenefits(combo2);
        combinations.push({
          schemes: combo2,
          totalBenefits: benefits.summary,
          description: benefits.description
        });
      }
    }
    
    // 3-scheme combinations
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        for (let k = j + 1; k < eligible.length; k++) {
          const combo3 = [eligible[i], eligible[j], eligible[k]];
          const benefits = getCombinationBenefits(combo3);
          combinations.push({
            schemes: combo3,
            totalBenefits: benefits.summary,
            description: benefits.description
          });
        }
      }
    }
    
    // 4-scheme combinations
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        for (let k = j + 1; k < eligible.length; k++) {
          for (let l = k + 1; l < eligible.length; l++) {
            const combo4 = [eligible[i], eligible[j], eligible[k], eligible[l]];
            const benefits = getCombinationBenefits(combo4);
            combinations.push({
              schemes: combo4,
              totalBenefits: benefits.summary,
              description: benefits.description
            });
          }
        }
      }
    }
    
    return combinations;
  };

  // Calculate benefits for a combination of schemes
  const getCombinationBenefits = (schemeList: Scheme[]) => {
    let totalCash = 0;
    let hasInsurance = false;
    let hasLoan = false;
    let hasSubsidy = false;
    let hasSeeds = false;
    let hasTraining = false;
    
    schemeList.forEach(scheme => {
      const name = scheme.name.toLowerCase();
      
      // PM-KISAN: ₹6,000/year
      if (name.includes('pm-kisan')) {
        totalCash += 6000;
      }
      
      // KALIA: ₹10,000/year (includes PM-KISAN ₹6,000)
      if (name.includes('kalia')) {
        totalCash += 10000; // Already includes PM-KISAN
      }
      
      // Insurance schemes
      if (name.includes('insurance') || name.includes('pmfby') || name.includes('kalia')) {
        hasInsurance = true;
      }
      
      // Loan schemes
      if (name.includes('kalia') || name.includes('loan') || name.includes('aif')) {
        hasLoan = true;
      }
      
      // Subsidy schemes
      if (name.includes('subsidy') || name.includes('mkuy') || name.includes('mechanization')) {
        hasSubsidy = true;
      }
      
      // Seed/Training schemes
      if (name.includes('nmeo') || name.includes('rice fallow') || name.includes('seed')) {
        hasSeeds = true;
        hasTraining = true;
      }
    });
    
    // Adjust for PM-KISAN + KALIA overlap (KALIA includes PM-KISAN)
    if (schemeList.some(s => s.name.includes('KALIA')) && schemeList.some(s => s.name.includes('PM-KISAN'))) {
      totalCash -= 6000; // Remove duplicate PM-KISAN amount
    }
    
    const benefits: string[] = [];
    if (totalCash > 0) {
      benefits.push(`₹${totalCash.toLocaleString()}/year cash support`);
    }
    if (hasInsurance) {
      benefits.push(lang === 'en' ? 'Insurance coverage' : 'ବୀମା ଆବରଣ');
    }
    if (hasLoan) {
      benefits.push(lang === 'en' ? 'Interest-free/low-interest loans' : 'ସୁଦ-ମୁକ୍ତ/ନିମ୍ନ-ସୁଦ ଋଣ');
    }
    if (hasSubsidy) {
      benefits.push(lang === 'en' ? 'Equipment/machinery subsidies' : 'ଉପକରଣ/ଯନ୍ତ୍ରପାତି ସବସିଡି');
    }
    if (hasSeeds) {
      benefits.push(lang === 'en' ? 'Free seeds & training' : 'ମାଗଣା ବିହନ ଏବଂ ପ୍ରଶିକ୍ଷଣ');
    }
    
    return {
      summary: benefits.join(' • '),
      description: lang === 'en' 
        ? `This combination provides ${benefits.length} key benefits: ${benefits.join(', ')}.`
        : `ଏହି ସଂଯୋଜନା ${benefits.length} ମୁଖ୍ୟ ଲାଭ ପ୍ରଦାନ କରେ: ${benefits.join(', ')} |`
    };
  };

  const schemeCombinations = generateSchemeCombinations();

  return (
    <div className="min-h-[70vh] bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {lang === 'en' ? 'Government Schemes' : 'ସରକାରୀ ଯୋଜନା'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {lang === 'en' 
                ? 'Comprehensive guide to agricultural schemes for oilseed farmers in Odisha'
                : 'ଓଡ଼ିଶାରେ ତେଲବିହନ କୃଷକମାନଙ୍କ ପାଇଁ କୃଷି ଯୋଜନାର ସମ୍ପୂର୍ଣ୍ଣ ଗାଇଡ୍'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-4 py-2 bg-enam-dark text-white rounded-lg hover:bg-enam-green transition"
        >
          <Filter size={18} />
          {lang === 'en' ? 'Check Eligibility' : 'ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ'}
        </button>
      </div>

      {/* Eligibility Filter Form */}
      {showFilter && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-enam-green" />
              {lang === 'en' ? 'Your Profile' : 'ଆପଣଙ୍କର ପ୍ରୋଫାଇଲ୍'}
            </h2>
            <button
              onClick={() => setShowFilter(false)}
              className="p-1 rounded-full hover:bg-white/50"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {lang === 'en' ? 'Farmer Type' : 'କୃଷକ ପ୍ରକାର'}
              </label>
              <select
                value={farmerProfile.farmerType}
                onChange={(e) => {
                  const newType = e.target.value;
                  const maxSize = getMaxLandSize(newType);
                  const minSize = getMinLandSize(newType);
                  let newLandSize = farmerProfile.landSize;
                  
                  // Auto-adjust land size if it exceeds the limit for new type
                  if (newLandSize > maxSize) {
                    newLandSize = maxSize;
                  }
                  if (newLandSize < minSize && newType === 'large') {
                    newLandSize = minSize;
                  }
                  if (newType === 'landless') {
                    newLandSize = 0;
                  }
                  
                  setFarmerProfile({ ...farmerProfile, farmerType: newType, landSize: newLandSize });
                }}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
              >
                <option value="">{lang === 'en' ? 'Select...' : 'ବାଛନ୍ତୁ...'}</option>
                <option value="small">{lang === 'en' ? 'Small Farmer (< 2.5 acres)' : 'ଛୋଟ କୃଷକ (< ୨.୫ ଏକର)'}</option>
                <option value="marginal">{lang === 'en' ? 'Marginal Farmer (< 1 acre)' : 'ସୀମାନ୍ତ କୃଷକ (< ୧ ଏକର)'}</option>
                <option value="large">{lang === 'en' ? 'Large Farmer (> 2.5 acres)' : 'ବଡ଼ କୃଷକ (> ୨.୫ ଏକର)'}</option>
                <option value="sharecropper">{lang === 'en' ? 'Sharecropper' : 'ବଟାଇଦାର'}</option>
                <option value="landless">{lang === 'en' ? 'Landless Agricultural Household' : 'ଭୂମିହୀନ କୃଷି ପରିବାର'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {lang === 'en' ? 'Land Size (acres)' : 'ଜମିର ଆକାର (ଏକର)'}
                {farmerProfile.farmerType && (
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({lang === 'en' 
                      ? `Max: ${getMaxLandSize(farmerProfile.farmerType)} ${getMaxLandSize(farmerProfile.farmerType) === 1 ? 'acre' : 'acres'}`
                      : `ସର୍ବାଧିକ: ${getMaxLandSize(farmerProfile.farmerType)} ${getMaxLandSize(farmerProfile.farmerType) === 1 ? 'ଏକର' : 'ଏକର'}`})
                  </span>
                )}
              </label>
              <input
                type="number"
                min={farmerProfile.farmerType ? getMinLandSize(farmerProfile.farmerType) : 0}
                max={farmerProfile.farmerType ? getMaxLandSize(farmerProfile.farmerType) : 1000}
                step="0.1"
                value={farmerProfile.landSize || ''}
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value) || 0;
                  const maxSize = farmerProfile.farmerType ? getMaxLandSize(farmerProfile.farmerType) : 1000;
                  const minSize = farmerProfile.farmerType ? getMinLandSize(farmerProfile.farmerType) : 0;
                  
                  if (inputValue > maxSize) {
                    setLandSizeError(
                      lang === 'en'
                        ? `${farmerProfile.farmerType === 'marginal' ? 'Marginal' : farmerProfile.farmerType === 'small' ? 'Small' : 'Large'} farmers can have maximum ${maxSize} ${maxSize === 1 ? 'acre' : 'acres'}`
                        : `${farmerProfile.farmerType === 'marginal' ? 'ସୀମାନ୍ତ' : farmerProfile.farmerType === 'small' ? 'ଛୋଟ' : 'ବଡ଼'} କୃଷକମାନଙ୍କର ସର୍ବାଧିକ ${maxSize} ${maxSize === 1 ? 'ଏକର' : 'ଏକର'} ହୋଇପାରେ`
                    );
                    setFarmerProfile({ ...farmerProfile, landSize: maxSize });
                  } else if (inputValue < minSize && farmerProfile.farmerType === 'large') {
                    setLandSizeError(
                      lang === 'en'
                        ? 'Large farmers must have more than 2.5 acres'
                        : 'ବଡ଼ କୃଷକମାନଙ୍କର ୨.୫ ଏକରରୁ ଅଧିକ ଜମି ରହିବା ଆବଶ୍ୟକ'
                    );
                    setFarmerProfile({ ...farmerProfile, landSize: minSize });
                  } else {
                    setLandSizeError('');
                    setFarmerProfile({ ...farmerProfile, landSize: inputValue });
                  }
                }}
                onBlur={(e) => {
                  const inputValue = parseFloat(e.target.value) || 0;
                  const maxSize = farmerProfile.farmerType ? getMaxLandSize(farmerProfile.farmerType) : 1000;
                  const minSize = farmerProfile.farmerType ? getMinLandSize(farmerProfile.farmerType) : 0;
                  
                  if (inputValue > maxSize) {
                    setLandSizeError(
                      lang === 'en'
                        ? `Maximum ${maxSize} ${maxSize === 1 ? 'acre' : 'acres'} allowed for ${farmerProfile.farmerType === 'marginal' ? 'marginal' : farmerProfile.farmerType === 'small' ? 'small' : 'large'} farmers`
                        : `${farmerProfile.farmerType === 'marginal' ? 'ସୀମାନ୍ତ' : farmerProfile.farmerType === 'small' ? 'ଛୋଟ' : 'ବଡ଼'} କୃଷକମାନଙ୍କ ପାଇଁ ସର୍ବାଧିକ ${maxSize} ${maxSize === 1 ? 'ଏକର' : 'ଏକର'} ଅନୁମୋଦିତ`
                    );
                  } else if (inputValue < minSize && farmerProfile.farmerType === 'large') {
                    setLandSizeError(
                      lang === 'en'
                        ? 'Large farmers must have more than 2.5 acres'
                        : 'ବଡ଼ କୃଷକମାନଙ୍କର ୨.୫ ଏକରରୁ ଅଧିକ ଜମି ରହିବା ଆବଶ୍ୟକ'
                    );
                  } else {
                    setLandSizeError('');
                  }
                }}
                disabled={farmerProfile.farmerType === 'landless'}
                className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-enam-green outline-none ${
                  landSizeError ? 'border-red-300' : 'border-gray-300'
                } ${farmerProfile.farmerType === 'landless' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={lang === 'en' ? 'e.g., 2.5' : 'ଉଦାହରଣ: ୨.୫'}
              />
              {landSizeError && (
                <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {landSizeError}
                </div>
              )}
              {farmerProfile.farmerType && !landSizeError && (
                <div className="mt-1 text-xs text-gray-500">
                  {lang === 'en'
                    ? `${farmerProfile.farmerType === 'marginal' ? 'Marginal farmers have < 1 acre' : farmerProfile.farmerType === 'small' ? 'Small farmers have < 2.5 acres' : farmerProfile.farmerType === 'large' ? 'Large farmers have > 2.5 acres' : farmerProfile.farmerType === 'landless' ? 'Landless farmers have 0 acres' : 'Sharecroppers can have varying land sizes'}`
                    : `${farmerProfile.farmerType === 'marginal' ? 'ସୀମାନ୍ତ କୃଷକମାନଙ୍କର < ୧ ଏକର' : farmerProfile.farmerType === 'small' ? 'ଛୋଟ କୃଷକମାନଙ୍କର < ୨.୫ ଏକର' : farmerProfile.farmerType === 'large' ? 'ବଡ଼ କୃଷକମାନଙ୍କର > ୨.୫ ଏକର' : farmerProfile.farmerType === 'landless' ? 'ଭୂମିହୀନ କୃଷକମାନଙ୍କର ୦ ଏକର' : 'ବଟାଇଦାରମାନଙ୍କର ବିଭିନ୍ନ ଜମିର ଆକାର ହୋଇପାରେ'}`}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRegistered"
                  checked={farmerProfile.isRegistered}
                  onChange={(e) => setFarmerProfile({ ...farmerProfile, isRegistered: e.target.checked })}
                  className="w-5 h-5 text-enam-green rounded focus:ring-enam-green"
                />
                <label htmlFor="isRegistered" className="text-sm font-medium text-gray-700 flex-1">
                  {lang === 'en' ? 'Registered on Go-Sugam/Agrisnet' : 'Go-Sugam/Agrisnetରେ ପଞ୍ଜୀକୃତ'}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFPOMember"
                  checked={farmerProfile.isFPOMember}
                  onChange={(e) => setFarmerProfile({ ...farmerProfile, isFPOMember: e.target.checked })}
                  className="w-5 h-5 text-enam-green rounded focus:ring-enam-green"
                />
                <label htmlFor="isFPOMember" className="text-sm font-medium text-gray-700 flex-1">
                  {lang === 'en' ? 'FPO/Cooperative Member' : 'FPO/ସହକାରିତା ସଦସ୍ୟ'}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isInCluster"
                  checked={farmerProfile.isInCluster}
                  onChange={(e) => setFarmerProfile({ ...farmerProfile, isInCluster: e.target.checked })}
                  className="w-5 h-5 text-enam-green rounded focus:ring-enam-green"
                />
                <label htmlFor="isInCluster" className="text-sm font-medium text-gray-700 flex-1">
                  {lang === 'en' ? 'In Value Chain Cluster' : 'ମୂଲ୍ୟ ଶୃଙ୍ଖଳା କ୍ଲଷ୍ଟରରେ'}
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasRiceFallow"
                checked={farmerProfile.hasRiceFallow}
                onChange={(e) => setFarmerProfile({ ...farmerProfile, hasRiceFallow: e.target.checked })}
                className="w-5 h-5 text-enam-green rounded focus:ring-enam-green"
              />
              <label htmlFor="hasRiceFallow" className="text-sm font-medium text-gray-700">
                {lang === 'en' ? 'Has Rice-Fallow Land' : 'ଧାନ-ପର୍ତ୍ତି ଜମି ଅଛି'}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasBankLoan"
                checked={farmerProfile.hasBankLoan}
                onChange={(e) => setFarmerProfile({ ...farmerProfile, hasBankLoan: e.target.checked })}
                className="w-5 h-5 text-enam-green rounded focus:ring-enam-green"
              />
              <label htmlFor="hasBankLoan" className="text-sm font-medium text-gray-700">
                {lang === 'en' ? 'Has Bank Loan/KCC' : 'ବ୍ୟାଙ୍କ ଋଣ/KCC ଅଛି'}
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {lang === 'en' ? 'Gender' : 'ଲିଙ୍ଗ'}
              </label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="gender-male"
                    name="gender"
                    value="male"
                    checked={farmerProfile.gender === 'male'}
                    onChange={(e) => setFarmerProfile({ ...farmerProfile, gender: e.target.value as 'male' | 'female' })}
                    className="w-5 h-5 text-enam-green focus:ring-enam-green"
                  />
                  <label htmlFor="gender-male" className="text-sm font-medium text-gray-700">
                    {lang === 'en' ? 'Male' : 'ପୁରୁଷ'}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="gender-female"
                    name="gender"
                    value="female"
                    checked={farmerProfile.gender === 'female'}
                    onChange={(e) => setFarmerProfile({ ...farmerProfile, gender: e.target.value as 'male' | 'female' })}
                    className="w-5 h-5 text-enam-green focus:ring-enam-green"
                  />
                  <label htmlFor="gender-female" className="text-sm font-medium text-gray-700">
                    {lang === 'en' ? 'Female' : 'ମହିଳା'}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {lang === 'en' ? 'Category' : 'ବର୍ଗ'}
              </label>
              <select
                value={farmerProfile.category}
                onChange={(e) => setFarmerProfile({ ...farmerProfile, category: e.target.value })}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
              >
                <option value="general">{lang === 'en' ? 'General' : 'ସାଧାରଣ'}</option>
                <option value="sc">{lang === 'en' ? 'SC' : 'SC'}</option>
                <option value="st">{lang === 'en' ? 'ST' : 'ST'}</option>
              </select>
            </div>
          </div>

          {/* Eligibility Summary */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">
                {lang === 'en' ? 'Eligibility Summary' : 'ଯୋଗ୍ୟତା ସାରାଂଶ'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                    filterMode === 'all' 
                      ? 'bg-enam-dark text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'en' ? 'All Schemes' : 'ସମସ୍ତ ଯୋଜନା'}
                </button>
                <button
                  onClick={() => setFilterMode('eligible')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                    filterMode === 'eligible' 
                      ? 'bg-enam-green text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'en' ? `Eligible (${eligibleSchemes.length})` : `ଯୋଗ୍ୟ (${eligibleSchemes.length})`}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {lang === 'en' 
                ? `You are eligible for ${eligibleSchemes.length} out of ${schemes.length} schemes.`
                : `ଆପଣ ${schemes.length} ଯୋଜନାରୁ ${eligibleSchemes.length} ଯୋଜନାରେ ଯୋଗ୍ୟ |`}
            </p>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {!showFilter && (
        <div className="bg-gradient-to-br from-enam-green/10 to-enam-dark/10 rounded-xl p-6 border border-enam-green/20">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={20} className="text-enam-green" />
            {lang === 'en' ? 'Ideal Benefit Stack for Oilseed Farmers' : 'ତେଲବିହନ କୃଷକମାନଙ୍କ ପାଇଁ ଆଦର୍ଶ ଲାଭ ଷ୍ଟାକ୍'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-bold text-gray-800 mb-2">{lang === 'en' ? 'Income:' : 'ଆୟ:'}</div>
              <div className="text-gray-600">₹10,000/year (PM-KISAN + KALIA)</div>
            </div>
            <div>
              <div className="font-bold text-gray-800 mb-2">{lang === 'en' ? 'Protection:' : 'ସୁରକ୍ଷା:'}</div>
              <div className="text-gray-600">{lang === 'en' ? 'PMFBY Insurance + KALIA Insurance' : 'PMFBY ବୀମା + KALIA ବୀମା'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-800 mb-2">{lang === 'en' ? 'Cultivation:' : 'ଚାଷ:'}</div>
              <div className="text-gray-600">{lang === 'en' ? 'NMEO Cluster (free seeds/training) + KALIA 0% loan' : 'NMEO କ୍ଲଷ୍ଟର (ମାଗଣା ବିହନ/ପ୍ରଶିକ୍ଷଣ) + KALIA ୦% ଋଣ'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-800 mb-2">{lang === 'en' ? 'Expansion:' : 'ବିସ୍ତାର:'}</div>
              <div className="text-gray-600">{lang === 'en' ? 'MKUY subsidy for oil processing unit' : 'ତେଲ ପ୍ରକ୍ରିୟାକରଣ ଏକକ ପାଇଁ MKUY ସବସିଡି'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Scheme Combinations Section */}
      {eligibleSchemes.length > 1 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={24} className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {lang === 'en' ? 'Available Scheme Combinations' : 'ଉପଲବ୍ଧ ଯୋଜନା ସଂଯୋଜନା'}
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {lang === 'en' 
              ? 'You can avail multiple schemes together. Here are the best combinations based on your eligibility:'
              : 'ଆପଣ ଏକାସାଙ୍ଗରେ ଅନେକ ଯୋଜନା ଉପଭୋଗ କରିପାରିବେ | ଆପଣଙ୍କର ଯୋଗ୍ୟତା ଅନୁସାରେ ସର୍ବୋତ୍ତମ ସଂଯୋଜନା ଏଠାରେ ଅଛି:'}
          </p>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {schemeCombinations.slice(0, 10).map((combo, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {lang === 'en' ? `Combination ${idx + 1}` : `ସଂଯୋଜନା ${idx + 1}`}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {combo.schemes.map((scheme, sIdx) => (
                        <span 
                          key={sIdx}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold"
                        >
                          {scheme.name.split(' ')[0]} {scheme.name.split(' ')[1] || ''}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-700 font-semibold mb-1">
                      {combo.totalBenefits}
                    </div>
                    <p className="text-xs text-gray-600">
                      {combo.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">
                      {lang === 'en' ? 'Schemes:' : 'ଯୋଜନା:'}
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      {combo.schemes.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {schemeCombinations.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              {lang === 'en' 
                ? `Showing top 10 of ${schemeCombinations.length} available combinations`
                : `${schemeCombinations.length} ଉପଲବ୍ଧ ସଂଯୋଜନାରୁ ଶୀର୍ଷ ୧୦ ଦେଖାଯାଉଛି`}
            </div>
          )}
        </div>
      )}

      {/* Schemes List */}
      <div className="space-y-6">
        {displayedSchemes.map((scheme, index) => {
          const eligibility = checkSchemeEligibility(scheme);
          return (
            <div 
              key={index}
              className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                eligibility.eligible ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Scheme Header */}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg border-2 ${
                    eligibility.eligible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {scheme.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {scheme.name}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {scheme.basicDetails}
                        </p>
                      </div>
                      {eligibility.eligible ? (
                        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={16} />
                          {lang === 'en' ? 'Eligible' : 'ଯୋଗ୍ୟ'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                          <AlertCircle size={16} />
                          {lang === 'en' ? 'Not Eligible' : 'ଅଯୋଗ୍ୟ'}
                        </div>
                      )}
                    </div>
                    {!eligibility.eligible && eligibility.reason && (
                      <div className="mt-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">
                        <strong>{lang === 'en' ? 'Reason: ' : 'କାରଣ: '}</strong>{eligibility.reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                {scheme.benefits.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} />
                      {lang === 'en' ? 'Benefits:' : 'ଲାଭ:'}
                    </h4>
                    <ul className="space-y-2">
                      {scheme.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Use Case */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2">
                    {lang === 'en' ? 'Best For:' : 'ସର୍ବୋତ୍ତମ:'}
                  </h4>
                  <p className="text-sm text-gray-700">{scheme.useCase}</p>
                </div>

                {/* Eligibility */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <h4 className="font-bold text-orange-900 mb-2">
                    {lang === 'en' ? 'Eligibility:' : 'ଯୋଗ୍ୟତା:'}
                  </h4>
                  <p className="text-sm text-gray-700">{scheme.eligibility}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedSchemes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-bold">
            {lang === 'en' ? 'No eligible schemes found' : 'କୌଣସି ଯୋଗ୍ୟ ଯୋଜନା ମିଳିଲା ନାହିଁ'}
          </p>
          <p className="text-sm mt-2">
            {lang === 'en' ? 'Try adjusting your profile or view all schemes' : 'ଆପଣଙ୍କର ପ୍ରୋଫାଇଲ୍ ସଂଶୋଧନ କରନ୍ତୁ କିମ୍ବା ସମସ୍ତ ଯୋଜନା ଦେଖନ୍ତୁ'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AboutSchemes;
