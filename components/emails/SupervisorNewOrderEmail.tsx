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

interface SupervisorNewOrderEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  dashboardLink: string;
}

export const SupervisorNewOrderEmail = ({
  orderId = 'N/A',
  customerName = 'Cliente',
  customerEmail = 'correo@ejemplo.com',
  total = 0,
  dashboardLink = 'http://localhost:3000/dashboard/pedidos',
}: SupervisorNewOrderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Nuevo Pedido Pendiente de Revisión - Suzuval</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nuevo Pedido B2B/B2C</Heading>
          <Text style={text}>
            Se ha ingresado un nuevo pedido que requiere revisión por parte de un supervisor.
          </Text>
          <Hr style={hr} />
          <Section>
            <Heading style={h2}>Detalles del Cliente</Heading>
            <Text style={itemText}><strong>Nombre:</strong> {customerName}</Text>
            <Text style={itemText}><strong>Email:</strong> {customerEmail}</Text>
            
            <Heading style={h2}>Orden</Heading>
            <Text style={itemText}><strong>ID:</strong> {orderId}</Text>
            <Text style={itemText}><strong>Total a verificar:</strong> ${total.toLocaleString('es-CL')}</Text>
          </Section>
          <Hr style={hr} />
          <Section style={{ textAlign: 'center', padding: '0 48px' }}>
            <Link href={dashboardLink} style={button}>
              Ver en el Dashboard
            </Link>
          </Section>
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
  color: '#d32f2f',
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
  margin: '16px 0 8px',
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

const itemText = {
  color: '#525f7f',
  fontSize: '14px',
  margin: '0 0 8px',
  padding: '0 48px',
};

const button = {
  backgroundColor: '#0033a0',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

export default SupervisorNewOrderEmail;
