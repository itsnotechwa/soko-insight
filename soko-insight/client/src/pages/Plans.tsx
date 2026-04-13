import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography, message, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PRICING_PLANS, SubscriptionTier } from '../config/pricing';
import { useAuthStore } from '../store/authStore';
import { authService, PricingPlan } from '../services/authService';

const { Title, Text } = Typography;

function Plans() {
  const navigate = useNavigate();
  const { user, updateSubscription, isLoading } = useAuthStore();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await authService.getPlans();
        setPlans(data.plans);
      } catch {
        // Fallback to client pricing config if endpoint fails
        setPlans(
          Object.values(PRICING_PLANS).map((plan) => ({
            tier: plan.tier,
            displayName: plan.name,
            monthlyPriceKes: plan.monthlyPriceKes,
            annualDiscountPercent: plan.annualDiscountPercent,
            features: plan.features,
            recommendedFor: ['small_trader', 'ecommerce', 'wholesaler'],
            limits: {
              maxProducts: 0,
              maxSalesChannels: 0,
              monthlyForecastRuns: 0,
              competitorChecksPerMonth: 0,
              maxTeamMembers: 0,
            },
          }))
        );
        message.warning('Could not load plans from server, showing fallback plans.');
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    try {
      setUpgradingTier(tier);
      await updateSubscription(tier);
      message.success(`Subscription updated to ${tier.toUpperCase()}`);
      navigate('/profile');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update subscription');
    } finally {
      setUpgradingTier(null);
    }
  };

  if (loadingPlans) {
    return (
      <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Space direction="vertical" size={8} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          Choose Your Plan
        </Title>
        <Text type="secondary">Select the subscription that fits your business stage.</Text>
      </Space>

      <Row gutter={[16, 16]}>
        {plans.map((plan) => {
          const isCurrentPlan = user?.subscriptionTier === plan.tier;

          return (
            <Col xs={24} md={12} lg={6} key={plan.tier}>
              <Card
                title={plan.name}
                extra={isCurrentPlan ? <Tag color="green">Current Plan</Tag> : null}
                style={{ height: '100%' }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Title level={4} style={{ marginBottom: 0 }}>
                      KES {plan.monthlyPriceKes.toLocaleString()}
                    </Title>
                    <Text type="secondary">per month</Text>
                  </div>

                  <Text>{plan.displayName} plan for growing sellers</Text>
                  {plan.annualDiscountPercent > 0 && (
                    <Tag color="blue">{plan.annualDiscountPercent}% annual discount</Tag>
                  )}

                  <div>
                    {plan.features.map((feature) => (
                      <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text>{feature}</Text>
                      </div>
                    ))}
                  </div>

                  <Button
                    type={isCurrentPlan ? 'default' : 'primary'}
                    block
                    disabled={isCurrentPlan}
                    loading={(isLoading && upgradingTier === plan.tier) || upgradingTier === plan.tier}
                    onClick={() => handleSelectPlan(plan.tier)}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Button style={{ marginTop: 24 }} onClick={() => navigate('/profile')}>
        Back to Profile
      </Button>
    </div>
  );
}

export default Plans;
