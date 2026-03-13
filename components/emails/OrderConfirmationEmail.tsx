import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
  Link
} from '@react-email/components';
import * as React from 'react';

interface OrderItem {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface OrderConfirmationEmailProps {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
}

export const OrderConfirmationEmail = ({
  orderId = 'N/A',
  customerName = 'Cliente',
  items = [],
  total = 0,
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirmación de Pedido Suzuval - #{orderId.substring(0, 8)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Gracias por tu pedido, {customerName}!</Heading>
          <Text style={text}>
            Hemos recibido tu pedido con identificador <strong>#{orderId}</strong> y actualmente se encuentra en revisión.
          </Text>
          <Hr style={hr} />
          <Section>
            <Heading style={h2}>Resumen de tu pedido</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column>
                  <Text style={itemText}>{item.nombre} (x{item.cantidad})</Text>
                </Column>
                <Column align="right">
                  <Text style={itemText}>${item.precio.toLocaleString('es-CL')}</Text>
                </Column>
              </Row>
            ))}
          </Section>
          <Hr style={hr} />
          <Row>
            <Column>
              <Text style={totalText}>Total Calculado</Text>
            </Column>
            <Column align="right">
              <Text style={totalText}>${total.toLocaleString('es-CL')}</Text>
            </Column>
          </Row>
          <Text style={footer}>
            Te enviaremos una notificación al correo cuando el estado de tu pedido cambie.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#0033a0',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  padding: '0 48px',
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
  padding: '0 48px',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const itemRow = {
  padding: '0 48px',
  marginBottom: '8px',
};

const itemText = {
  color: '#525f7f',
  fontSize: '14px',
  margin: '0',
};

const totalText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '32px',
};

export default OrderConfirmationEmail;
